<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class JwtHelper
{
    /**
     * Generate JWT Token for a user
     */
    public static function generateToken($user, $permissions = [])
    {
        $key = ENCRYPTION_KEY;
        $payload = [
            'iss' => BASE_URL,
            'aud' => BASE_URL,
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24), // 24 jam berlaku
            'user' => [
                'id' => $user['id_pengguna'],
                'email' => $user['email'] ?? '',
                'name' => $user['nama_lengkap'],
                'role' => $user['nama_role'],
                'id_role' => $user['id_role'],
                'permissions' => $permissions
            ]
        ];

        return JWT::encode($payload, $key, 'HS256');
    }

    /**
     * Validate JWT Token
     */
    public static function validateToken($token)
    {
        try {
            $key = ENCRYPTION_KEY;
            return JWT::decode($token, new Key($key, 'HS256'));
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get bearer token from headers
     */
    public static function getBearerToken()
    {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { // Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
}
