<?php

// Define constants
define('ROOT_PATH', dirname(__DIR__));
define('APP_PATH', ROOT_PATH . '/app');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS')
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: X-Requested-With, X-CSRF-Token, Content-Type, Authorization');
    exit(0);
}

// Muat autoloader Composer
if (file_exists(ROOT_PATH . '/vendor/autoload.php'))
{
    require_once ROOT_PATH . '/vendor/autoload.php';
}

// Muat variabel dari file .env
if (class_exists('Dotenv\Dotenv'))
{
    $dotenv = Dotenv\Dotenv::createImmutable(ROOT_PATH);
    $dotenv->load();
}

// --- PENGATURAN LINGKUNGAN (ENVIRONMENT) ---
define('ENVIRONMENT', $_ENV['APP_ENV'] ?? 'production');
define('BASE_URL', $_ENV['BASE_URL'] ?? 'http://localhost');
$encryptionKey = $_ENV['ENCRYPTION_KEY'] ?? NULL;
if (!$encryptionKey)
{
    // Generate random key jika tidak ada di .env
    $encryptionKey = bin2hex(random_bytes(32));
    error_log("WARNING: Using auto-generated encryption key. Please set ENCRYPTION_KEY in .env file!");
}
define('ENCRYPTION_KEY', $encryptionKey);
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? '');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_PORT', $_ENV['DB_PORT'] ?? 3306);
define('MAX_LOGIN_ATTEMPTS', $_ENV['MAX_LOGIN_ATTEMPTS'] ?? 5);
define('LOCKOUT_TIME', $_ENV['LOCKOUT_TIME'] ?? 300);
$sessionPath = ROOT_PATH . '/app/sessions';
if (!is_dir($sessionPath))
{
    mkdir($sessionPath, 0777, TRUE);
}
session_save_path($sessionPath);
// Pengaturan Error Reporting
if (ENVIRONMENT === 'development')
{
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else
{
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Start output buffering
ob_start();

// Muat file inti
require_once APP_PATH . '/core/Helper.php';
require_once APP_PATH . '/core/Encryption.php';
require_once APP_PATH . '/core/Model.php';
require_once APP_PATH . '/core/Controller.php';
require_once APP_PATH . '/core/Router.php';

// Handle errors gracefully
set_exception_handler(function ($exception)
{
    error_log("Uncaught Exception: " . $exception->getMessage());

    // Log detailed error for debugging
    error_log("File: " . $exception->getFile() . ":" . $exception->getLine());
    error_log("Trace: " . $exception->getTraceAsString());

    if (ENVIRONMENT === 'development')
    {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => FALSE,
            'message' => 'Internal Server Error',
            'error'   => $exception->getMessage(),
            'file'    => $exception->getFile() . ":" . $exception->getLine()
        ]);
    } else
    {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => FALSE,
            'message' => 'Internal Server Error',
        ]);
    }
    exit;
});

// Jalankan Router
try
{
    $router = new Router();
    $router->dispatch();
} catch (Exception $e)
{
    error_log("Router Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([ 'success' => FALSE, 'message' => 'Internal Server Error' ]);
}

// Clean output buffer
ob_end_flush();