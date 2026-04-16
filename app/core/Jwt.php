<?php

class Jwt {
    private static ?string $secret = null;

    private static function getSecret(): string {
        if (self::$secret === null) {
            self::$secret = $_ENV['JWT_SECRET'] ?? throw new Exception('JWT_SECRET not configured');
        }
        return self::$secret;
    }

    /**
     * Membuat JWT token dengan HS256 algorithm.
     * Token memiliki expiration 24 jam (exp claim).
     *
     * @param array $payload Data payload untuk JWT
     * @return string JWT token yang sudah di-encode
     */
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode(array_merge($payload, ['exp' => time() + (60 * 60 * 24)]));

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::getSecret(), true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    /**
     * Memvalidasi dan decode JWT token.
     * Jika signature tidak valid atau token expired, mengembalikan null.
     *
     * @param string $token JWT token yang akan di-decode
     * @return array|null Data payload atau null jika invalid
     */
    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        list($header, $payload, $signature) = $parts;

        // Decode signature from URL-safe base64 to raw bytes
        $signature = str_replace(['-', '_'], ['+', '/'], $signature);
        $signature = base64_decode($signature, true);

        // Compute expected signature
        $expected = hash_hmac('sha256', $header . "." . $payload, self::getSecret(), true);

        // Timing-safe comparison
        if ($signature === false || !hash_equals($expected, $signature)) return null;

        $decodedPayload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);

        // Cek apakah token sudah expired
        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return null;
        }

        return $decodedPayload;
    }
}
