<?php

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
        switch ($method) {
            case 'process_login':
                $input = json_decode(file_get_contents('php://input'), true);
                $result = $this->authModel->processLogin($input['username'] ?? '', $input['password'] ?? '');

                if ($result['success'] === true) {
                    $token = JwtHelper::generateToken($result['user']);
                    $userData = [
                        'id' => $result['user']['id_pengguna'],
                        'username' => $result['user']['username'],
                        'role' => $result['user']['nama_role']
                    ];
                    echo json_encode(['success' => true, 'token' => $token, 'user' => $userData]);
                    return;
                }
                http_response_code(401);
                echo json_encode($result);
                return;

            case 'me':
                // Validate JWT token
                $decoded = $this->validateJwt();
                $user = $decoded['user'];

                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['email'],
                        'name' => $user['name'],
                        'role' => $user['role']
                    ]
                ]);
                return;

            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Unknown method']);
                return;
        }
    }

}