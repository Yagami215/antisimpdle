(module
  ;; Memory: initial 16 pages (1MB), max 128 pages (8MB)
  (memory (export "memory") 16 128)

  ;; Memory layout:
  ;; 0..63: current working state (16 i32 words)
  ;; 64..127: initial block state (16 i32 words)
  ;; 128..159: key (8 i32 words)
  ;; 160..175: nonce (4 i32 words)
  ;; 1024..: data payload (16 bytes nonce + ciphertext)

  (func $rotl (param $v i32) (param $c i32) (result i32)
    (i32.rotl (local.get $v) (local.get $c))
  )

  ;; Quarter-round: qr(a, b, c, d) where a, b, c, d are byte offsets into state (0..60)
  (func $qr (param $a i32) (param $b i32) (param $c i32) (param $d i32)
    (local $va i32)
    (local $vb i32)
    (local $vc i32)
    (local $vd i32)

    (local.set $va (i32.load (local.get $a)))
    (local.set $vb (i32.load (local.get $b)))
    (local.set $vc (i32.load (local.get $c)))
    (local.set $vd (i32.load (local.get $d)))

    ;; a += b; d ^= a; d = rotl(d, 16);
    (local.set $va (i32.add (local.get $va) (local.get $vb)))
    (local.set $vd (i32.rotl (i32.xor (local.get $vd) (local.get $va)) (i32.const 16)))

    ;; c += d; b ^= c; b = rotl(b, 12);
    (local.set $vc (i32.add (local.get $vc) (local.get $vd)))
    (local.set $vb (i32.rotl (i32.xor (local.get $vb) (local.get $vc)) (i32.const 12)))

    ;; a += b; d ^= a; d = rotl(d, 8);
    (local.set $va (i32.add (local.get $va) (local.get $vb)))
    (local.set $vd (i32.rotl (i32.xor (local.get $vd) (local.get $va)) (i32.const 8)))

    ;; c += d; b ^= c; b = rotl(b, 7);
    (local.set $vc (i32.add (local.get $vc) (local.get $vd)))
    (local.set $vb (i32.rotl (i32.xor (local.get $vb) (local.get $vc)) (i32.const 7)))

    ;; Store back
    (i32.store (local.get $a) (local.get $va))
    (i32.store (local.get $b) (local.get $vb))
    (i32.store (local.get $c) (local.get $vc))
    (i32.store (local.get $d) (local.get $vd))
  )

  ;; Internal key derivation: derives 8 words of key into memory 128..159
  (func $derive_key (param $item_code i32)
    (local $seed i32)
    (local $i i32)
    (local $target i32)

    ;; seed = (0x9e3779b9 ^ (item_code * 0x85ebca6b))
    (local.set $seed
      (i32.xor (i32.const 0x9e3779b9) (i32.mul (local.get $item_code) (i32.const 0x85ebca6b)))
    )

    (local.set $i (i32.const 0))
    (local.set $target (i32.const 128))

    (loop $derive_loop
      ;; seed = seed + 0x7feb352d + (item_code << (i + 1))
      (local.set $seed
        (i32.add
          (i32.add (local.get $seed) (i32.const 0x7feb352d))
          (i32.shl (local.get $item_code) (i32.add (local.get $i) (i32.const 1)))
        )
      )
      ;; seed = (seed ^ rotl(seed, 13)) * 0x5bd1e995
      (local.set $seed
        (i32.mul
          (i32.xor (local.get $seed) (i32.rotl (local.get $seed) (i32.const 13)))
          (i32.const 0x5bd1e995)
        )
      )
      ;; seed = seed ^ (seed >> 15)
      (local.set $seed (i32.xor (local.get $seed) (i32.shr_u (local.get $seed) (i32.const 15))))

      ;; store in memory
      (i32.store (local.get $target) (local.get $seed))

      (local.set $target (i32.add (local.get $target) (i32.const 4)))
      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br_if $derive_loop (i32.lt_u (local.get $i) (i32.const 8)))
    )
  )

  ;; Process 1 block of 64 bytes
  (func $chacha20_block
    (local $round i32)
    (local $i i32)

    ;; Copy initial state (64..127) to working state (0..63)
    (local.set $i (i32.const 0))
    (loop $copy_loop
      (i32.store (local.get $i) (i32.load (i32.add (local.get $i) (i32.const 64))))
      (local.set $i (i32.add (local.get $i) (i32.const 4)))
      (br_if $copy_loop (i32.lt_u (local.get $i) (i32.const 64)))
    )

    ;; 10 double rounds (20 rounds total)
    (local.set $round (i32.const 0))
    (loop $round_loop
      ;; Column rounds
      (call $qr (i32.const 0)  (i32.const 16) (i32.const 32) (i32.const 48))
      (call $qr (i32.const 4)  (i32.const 20) (i32.const 36) (i32.const 52))
      (call $qr (i32.const 8)  (i32.const 24) (i32.const 40) (i32.const 56))
      (call $qr (i32.const 12) (i32.const 28) (i32.const 44) (i32.const 60))

      ;; Diagonal rounds
      (call $qr (i32.const 0)  (i32.const 20) (i32.const 40) (i32.const 60))
      (call $qr (i32.const 4)  (i32.const 24) (i32.const 44) (i32.const 48))
      (call $qr (i32.const 8)  (i32.const 28) (i32.const 32) (i32.const 52))
      (call $qr (i32.const 12) (i32.const 16) (i32.const 36) (i32.const 56))

      (local.set $round (i32.add (local.get $round) (i32.const 1)))
      (br_if $round_loop (i32.lt_u (local.get $round) (i32.const 10)))
    )

    ;; Add working state to initial state: state[i] += orig[i]
    (local.set $i (i32.const 0))
    (loop $add_loop
      (i32.store (local.get $i)
        (i32.add
          (i32.load (local.get $i))
          (i32.load (i32.add (local.get $i) (i32.const 64)))
        )
      )
      (local.set $i (i32.add (local.get $i) (i32.const 4)))
      (br_if $add_loop (i32.lt_u (local.get $i) (i32.const 64)))
    )
  )

  ;; Exported: get buffer pointer for JavaScript input
  (func (export "get_buffer_ptr") (result i32)
    (i32.const 1024)
  )

  ;; Exported: Decrypt payload in-place
  ;; Payload at 1024 contains:
  ;;   0..15: 16-byte nonce
  ;;   16..payload_len-1: ciphertext
  ;; Returns plaintext length (payload_len - 16) on success, or 0 on error
  (func (export "decrypt_payload") (param $item_code i32) (param $payload_len i32) (result i32)
    (local $data_ptr i32)
    (local $bytes_left i32)
    (local $block_bytes i32)
    (local $i i32)
    (local $counter i32)
    (local $w12 i32)

    ;; Validate item_code (1 = Divine, 2 = Hell)
    (if (i32.and (i32.ne (local.get $item_code) (i32.const 1)) (i32.ne (local.get $item_code) (i32.const 2)))
      (then (return (i32.const 0)))
    )

    ;; Validate payload_len (> 16 bytes)
    (if (i32.le_u (local.get $payload_len) (i32.const 16))
      (then (return (i32.const 0)))
    )

    ;; 1. Derive key into 128..159
    (call $derive_key (local.get $item_code))

    ;; 2. Read nonce from payload (1024..1039) into 160..175
    (i32.store (i32.const 160) (i32.load (i32.const 1024)))
    (i32.store (i32.const 164) (i32.load (i32.const 1028)))
    (i32.store (i32.const 168) (i32.load (i32.const 1032)))
    (i32.store (i32.const 172) (i32.load (i32.const 1036)))

    ;; 3. Setup initial state in 64..127:
    ;; 64..79: "expand 32-byte k" constants
    (i32.store (i32.const 64) (i32.const 0x61707865))
    (i32.store (i32.const 68) (i32.const 0x3320646e))
    (i32.store (i32.const 72) (i32.const 0x79622d32))
    (i32.store (i32.const 76) (i32.const 0x6b206574))

    ;; 80..111: 8 key words from 128..159
    (local.set $i (i32.const 0))
    (loop $copy_key
      (i32.store
        (i32.add (i32.const 80) (local.get $i))
        (i32.load (i32.add (i32.const 128) (local.get $i)))
      )
      (local.set $i (i32.add (local.get $i) (i32.const 4)))
      (br_if $copy_key (i32.lt_u (local.get $i) (i32.const 32)))
    )

    ;; 112..127: 4 nonce words from 160..175
    (local.set $w12 (i32.load (i32.const 160)))
    (i32.store (i32.const 112) (local.get $w12))
    (i32.store (i32.const 116) (i32.load (i32.const 164)))
    (i32.store (i32.const 120) (i32.load (i32.const 168)))
    (i32.store (i32.const 124) (i32.load (i32.const 172)))

    ;; Ciphertext starts at 1040 (1024 + 16)
    (local.set $data_ptr (i32.const 1040))
    (local.set $bytes_left (i32.sub (local.get $payload_len) (i32.const 16)))
    (local.set $counter (i32.const 0))

    ;; Loop over 64-byte blocks
    (loop $blocks_loop
      ;; Update word 12 (counter) in initial state: w12 + counter
      (i32.store (i32.const 112) (i32.add (local.get $w12) (local.get $counter)))

      ;; Run ChaCha20 block function -> keystream stored at 0..63
      (call $chacha20_block)

      ;; How many bytes to XOR in this block?
      (if (i32.ge_u (local.get $bytes_left) (i32.const 64))
        (then (local.set $block_bytes (i32.const 64)))
        (else (local.set $block_bytes (local.get $bytes_left)))
      )

      ;; XOR keystream bytes with ciphertext in-place
      (local.set $i (i32.const 0))
      (loop $xor_loop
        (i32.store8
          (i32.add (local.get $data_ptr) (local.get $i))
          (i32.xor
            (i32.load8_u (i32.add (local.get $data_ptr) (local.get $i)))
            (i32.load8_u (local.get $i))
          )
        )
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br_if $xor_loop (i32.lt_u (local.get $i) (local.get $block_bytes)))
      )

      (local.set $data_ptr (i32.add (local.get $data_ptr) (local.get $block_bytes)))
      (local.set $bytes_left (i32.sub (local.get $bytes_left) (local.get $block_bytes)))
      (local.set $counter (i32.add (local.get $counter) (i32.const 1)))

      (br_if $blocks_loop (i32.gt_u (local.get $bytes_left) (i32.const 0)))
    )

    ;; Wipe internal state & derived key from memory (zero memory 0..256)
    (local.set $i (i32.const 0))
    (loop $wipe_loop
      (i32.store (local.get $i) (i32.const 0))
      (local.set $i (i32.add (local.get $i) (i32.const 4)))
      (br_if $wipe_loop (i32.lt_u (local.get $i) (i32.const 256)))
    )

    ;; Return plaintext length (payload_len - 16)
    (i32.sub (local.get $payload_len) (i32.const 16))
  )
)
