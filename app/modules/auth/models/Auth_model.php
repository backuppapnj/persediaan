<?php

require_once APP_PATH . '/core/Model.php';

class Auth_model extends Model
{

    /**
     * [METHOD BARU] Memproses seluruh logika login.
     */
    public function processLogin($username, $password)
    {
        $user = $this->getUserByUsername($username);
        if ($user && password_verify($password, $user['password'])) {
            return ['success' => true, 'user' => $user];
        }
        return ['success' => false, 'message' => 'Username atau password salah.'];
    }

    private function createUserSession($user)
    {

        session_regenerate_id(TRUE);
        $_SESSION['user_id']   = $user['id_pengguna'];
        $_SESSION['nama']      = $user['nama_lengkap'];
        $_SESSION['id_role']   = $user['id_role'];
        $_SESSION['nama_role'] = $user['nama_role']; // Simpan nama role

        // Ambil dan simpan semua izin pengguna ke sesi
        $_SESSION['permissions'] = $this->getUserPermissions($user['id_role']);

        $_SESSION['last_regen'] = time();
    }

    public function getUserByUsername($username)
    {
        $sql = "
            SELECT u.*, r.nama_role 
            FROM tbl_pengguna u 
            LEFT JOIN tbl_roles r ON u.id_role = r.id_role
            WHERE u.username = :username AND u.is_active = 1
        ";
        return $this->fetchOne($sql, ['username' => $username]);
    }

    public function getUserPermissions($id_role)
    {
        $permissions = [];
        if (empty($id_role)) return $permissions;

        $sql = "
            SELECT p.nama_permission 
            FROM tbl_role_permissions rp
            JOIN tbl_permissions p ON rp.id_permission = p.id_permission
            WHERE rp.id_role = :id_role
        ";
        $results = $this->fetchAll($sql, ['id_role' => $id_role]);
        foreach ($results as $row) {
            $permissions[] = $row['nama_permission'];
        }
        return $permissions;
    }

    public function getLoginAttempts($username)
    {

        // Di aplikasi nyata, ini akan mengambil dari tabel 'login_attempts'
        // Untuk saat ini, kita simulasikan dengan session
        return $_SESSION['login_attempts'][$username] ?? NULL;
    }

    public function recordLoginAttempt($username)
    {

        if (!isset($_SESSION['login_attempts'][$username]))
        {
            $_SESSION['login_attempts'][$username] = [ 'attempts' => 0, 'last_attempt' => 0 ];
        }
        $_SESSION['login_attempts'][$username]['attempts']++;
        $_SESSION['login_attempts'][$username]['last_attempt'] = time();
    }

    public function clearLoginAttempts($username)
    {

        if (isset($_SESSION['login_attempts'][$username]))
        {
            unset($_SESSION['login_attempts'][$username]);
        }
    }

}