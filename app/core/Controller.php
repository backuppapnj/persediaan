<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
class Controller
{

    protected $encryption;

    protected $isApiRequest = FALSE;

    public function __construct()
    {

        $this->initializeSession();
        $this->encryption   = new Encryption(ENCRYPTION_KEY);
        $this->isApiRequest = $this->isAjaxRequest();
    }

    protected function initializeSession()
    {

        if (session_status() === PHP_SESSION_NONE)
        {
            start_secure_session();
        }

        // Initialize CSRF token if not exists
        if (empty($_SESSION['csrf_token']))
        {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
    }

    public function model($module, $model)
    {

        $model_path = APP_PATH . "/modules/$module/models/$model.php";

        if (!file_exists($model_path))
        {
            error_log("Model not found: $model_path");
            throw new Exception("Model $model tidak ditemukan");
        }

        require_once $model_path;

        if (!class_exists($model))
        {
            error_log("Model class not found: $model");
            throw new Exception("Model class $model tidak ditemukan");
        }

        return new $model();
    }

    public function view($module, $view, $data = [])
    {

        $view_path = APP_PATH . "/modules/$module/views/$view.php";

        if (!file_exists($view_path))
        {
            throw new Exception("View tidak ditemukan: $view_path");
        }

        extract($data);
        require_once $view_path;
    }

    public function redirect($url, $flash_message = NULL)
    {

        if ($flash_message)
        {
            set_flash_message($flash_message['type'], $flash_message['message']);
        }

        header('Location: ' . BASE_URL . $url);
        exit();
    }

    public function jsonResponse($data, $statusCode = 200)
    {

        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit();
    }

    public function validateCsrfToken()
    {

        if (!$this->isApiRequest)
        {
            return TRUE;
        }

        $csrf_token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if (empty($csrf_token) || !hash_equals($_SESSION['csrf_token'], $csrf_token))
        {
            $this->jsonResponse([
                'success' => FALSE,
                'message' => 'CSRF token tidak valid',
            ], 403);
        }

        return TRUE;
    }

    public function requirePermission($permission)
    {

        if (!has_permission($permission))
        {
            if ($this->isApiRequest)
            {
                $this->jsonResponse([
                    'success' => FALSE,
                    'message' => 'Akses ditolak',
                ], 403);
            } else
            {
                $this->redirect('/dashboard', [
                    'type'    => 'danger',
                    'message' => 'Anda tidak memiliki akses ke halaman ini.',
                ]);
            }
        }
    }

    protected function isAjaxRequest()
    {

        return isset($_SERVER['HTTP_X_REQUESTED_WITH']) &&
            strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    }

    protected function getRequestData()
    {

        if ($_SERVER['REQUEST_METHOD'] === 'POST')
        {
            return $_POST;
        }

        $input = file_get_contents('php://input');
        if (!empty($input))
        {
            return json_decode($input, TRUE) ?? [];
        }

        return $_GET;
    }

    public function validateEncryptedId($encryptedId, $redirectOnFail = TRUE)
    {

        $decryptedId = decrypt_id($encryptedId);

        if ($decryptedId === FALSE || !is_numeric($decryptedId))
        {
            if ($this->isApiRequest)
            {
                $this->jsonResponse([
                    'success' => FALSE,
                    'message' => 'ID tidak valid',
                ], 400);
            } elseif ($redirectOnFail)
            {
                $this->redirect('/dashboard', [
                    'type'    => 'danger',
                    'message' => 'ID tidak valid',
                ]);
            }
            return FALSE;
        }

        return (int) $decryptedId;
    }

    public function getValidatedId($paramName = 'id', $redirectOnFail = TRUE)
    {

        $encryptedId = $_GET[$paramName] ?? $_POST[$paramName] ?? NULL;

        if (!$encryptedId)
        {
            if ($this->isApiRequest)
            {
                $this->jsonResponse([
                    'success' => FALSE,
                    'message' => 'Parameter ID tidak ditemukan',
                ], 400);
            } elseif ($redirectOnFail)
            {
                $this->redirect('/dashboard', [
                    'type'    => 'danger',
                    'message' => 'Parameter ID tidak ditemukan',
                ]);
            }
            return FALSE;
        }

        return $this->validateEncryptedId($encryptedId, $redirectOnFail);
    }

    protected function validateJwt()
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            try {
                $decoded = JWT::decode($token, new Key(ENCRYPTION_KEY, 'HS256'));
                return (array) $decoded;
            } catch (Exception $e) {
                $this->jsonResponse(['success' => false, 'message' => 'Token tidak valid atau kadaluarsa'], 401);
            }
        }
        $this->jsonResponse(['success' => false, 'message' => 'Token diperlukan'], 401);
    }
}