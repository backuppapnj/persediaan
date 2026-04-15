<?php

require_once APP_PATH . '/core/Controller.php';

class Barang extends Controller
{
    private $barangModel;

    public function __construct()
    {
        parent::__construct();
        $this->barangModel = $this->model('barang', 'Barang_model');
    }

    public function api($method = '')
    {
        header('Content-Type: application/json');

        // Semua endpoint API harus divalidasi JWT-nya
        $decoded = $this->validateJwt();

        switch ($method) {
            case 'index':
                $this->index();
                break;
            case 'show':
                $this->show();
                break;
            case 'store':
                $this->store();
                break;
            case 'update':
                $this->update();
                break;
            case 'destroy':
                $this->destroy();
                break;
            case 'kategori':
                $this->kategori();
                break;
            case 'satuan':
                $this->satuan();
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Unknown method']);
                break;
        }
    }

    private function index()
    {
        try {
            $barang = $this->barangModel->getAllActive();
            echo json_encode(['success' => true, 'data' => $barang]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal mengambil data barang']);
        }
    }

    private function show()
    {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID diperlukan']);
            return;
        }

        try {
            $barang = $this->barangModel->getById($id);
            if ($barang) {
                echo json_encode(['success' => true, 'data' => $barang]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Barang tidak ditemukan']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal mengambil data barang']);
        }
    }

    private function store()
    {
        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $decoded['user']['id'] ?? null;

        $required = ['kode_barang', 'nama_barang', 'jenis_barang', 'id_kategori', 'id_satuan'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => "Field $field diperlukan"]);
                return;
            }
        }

        try {
            $result = $this->barangModel->create($input, $userId);
            if ($result['success']) {
                http_response_code(201);
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode($result);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal menambahkan barang']);
        }
    }

    private function update()
    {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID diperlukan']);
            return;
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $userId = $decoded['user']['id'] ?? null;

        try {
            $result = $this->barangModel->update($id, $input, $userId);
            if ($result['success']) {
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode($result);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal memperbarui barang']);
        }
    }

    private function destroy()
    {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID diperlukan']);
            return;
        }

        $userId = $decoded['user']['id'] ?? null;

        try {
            $result = $this->barangModel->softDelete($id, $userId);
            if ($result['success']) {
                echo json_encode($result);
            } else {
                http_response_code(400);
                echo json_encode($result);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus barang']);
        }
    }

    private function kategori()
    {
        try {
            $kategori = $this->barangModel->getAllKategori();
            echo json_encode(['success' => true, 'data' => $kategori]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal mengambil data kategori']);
        }
    }

    private function satuan()
    {
        try {
            $satuan = $this->barangModel->getAllSatuan();
            echo json_encode(['success' => true, 'data' => $satuan]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Gagal mengambil data satuan']);
        }
    }
}
