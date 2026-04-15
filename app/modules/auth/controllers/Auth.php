<?php

use Firebase\JWT\JWT;
require_once APP_PATH . '/core/Controller.php';

class Auth extends Controller
{

    private $authModel;

    public function __construct()
    {

        parent::__construct();
        if (isset($_SESSION['user_id']) && strpos($_SERVER['REQUEST_URI'], '/auth/logout') === FALSE)
        {
            $this->redirect('/dashboard');
        }
        $this->authModel = $this->model('auth', 'Auth_model');
    }

    public function index()
    {

        // [PERBAIKAN] Tidak perlu lagi memanggil set_csrf_token() di sini.
        $data['title']     = 'Login';
        $data['js_module'] = 'auth';
        $this->view('auth', 'login_view', $data);
    }

    public function logout()
    {

        session_destroy();
        $this->redirect('/auth');
    }

    public function api($method = '')
    {
        header('Content-Type: application/json');
        if ($method === 'process_login') {
            $input = json_decode(file_get_contents('php://input'), true);
            $result = $this->authModel->processLogin($input['username'] ?? '', $input['password'] ?? '');
            
            if ($result['success']) {
                $payload = [
                    'iss' => BASE_URL,
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24), // 24 jam
                    'data' => [
                        'id' => $result['user']['id_pengguna'],
                        'username' => $result['user']['username'],
                        'role' => $result['user']['nama_role']
                    ]
                ];
                $token = JWT::encode($payload, ENCRYPTION_KEY, 'HS256');
                echo json_encode(['success' => true, 'token' => $token, 'user' => $payload['data']]);
                return;
            }
            echo json_encode($result);
        }
    }

}