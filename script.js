// Konfigurasi
const API_URL = 'https://script.google.com/macros/s/AKfycbwgsBW77Sx_weOksCQX-hBrC15A5LWDt3iIckDvX0-KHTzL-UddGSi3N7H6hqI2voNs/exec'; // Ganti dengan URL Web App GAS
const API_TOKEN = 'HrD@S3cr3t#2023!LetterSys'; // Harus sama dengan di GAS

// Inisialisasi saat dokumen siap
document.addEventListener('DOMContentLoaded', function() {
    initDatePickers();
    setupEventListeners();
    loadInitialData();
});

// Fungsi inisialisasi
function initDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('letterDate').value = today;
    document.getElementById('filterDate').value = today;
}

function setupEventListeners() {
    // Form surat
    document.getElementById('letterForm').addEventListener('submit', handleLetterSubmit);
    
    // Form filter
    document.getElementById('filterForm').addEventListener('submit', handleFilterSubmit);
    
    // Tombol refresh
    document.getElementById('refreshBtn').addEventListener('click', () => loadLetters());
}

function loadInitialData() {
    // Load data HRD dan Jenis Surat dari GAS (simulasi)
    populateDropdowns();
    
    // Load data surat
    loadLetters();
}

// Fungsi utama
async function loadLetters(filters = {}) {
    const tableBody = document.getElementById('lettersTable');
    try {
        // Tampilkan loading
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';

        // Fetch data dari GAS
        const response = await fetch(`${API_URL}?action=getLetters&token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(filters)
        });

        if (!response.ok) throw new Error('Gagal memuat data');
        
        const data = await response.json();
        renderLettersTable(data.letters);
        
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">${error.message}</td></tr>`;
    }
}

function renderLettersTable(letters) {
    const tableBody = document.getElementById('lettersTable');
    
    if (letters.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Tidak ada data surat</td></tr>';
        return;
    }
    
    tableBody.innerHTML = letters.map((letter, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${letter.hrdName}</td>
            <td>${formatDisplayDate(letter.createdAt)}</td>
            <td>${letter.letterType}</td>
            <td>${letter.recipientName || '-'}</td>
            <td>${letter.notes || '-'}</td>
            <td><span class="badge bg-primary">${letter.letterNumber}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 view-btn" data-id="${letter.id}">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${letter.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Tambahkan event listener untuk tombol aksi
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleViewLetter);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteLetter);
    });
}

// Handler form surat
async function handleLetterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
        // Tampilkan loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Memproses...';
        
        // Ambil data form
        const formData = {
            hrdName: document.getElementById('hrdName').value,
            letterType: document.getElementById('letterType').value,
            letterDate: document.getElementById('letterDate').value,
            recipientName: document.getElementById('recipientName').value,
            notes: document.getElementById('letterNotes').value
        };
        
        // Generate nomor surat
        const letterNumber = await generateLetterNumber(formData);
        
        // Simpan data surat
        const saveResponse = await saveLetter({
            ...formData,
            letterNumber: letterNumber
        });
        
        // Tampilkan hasil
        alert(`Surat berhasil dibuat!\nNomor: ${letterNumber}`);
        
        // Reset form
        form.reset();
        document.getElementById('letterDate').value = new Date().toISOString().split('T')[0];
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        
        // Refresh tabel
        loadLetters();
        
    } catch (error) {
        console.error('Error:', error);
        alert(`Gagal membuat surat: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Simpan Surat';
    }
}

// Fungsi bantuan
async function generateLetterNumber(data) {
    const response = await fetch(`${API_URL}?action=generate&token=${API_TOKEN}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error('Gagal generate nomor surat');
    
    const result = await response.json();
    return result.nomorSurat;
}

async function saveLetter(letterData) {
    const response = await fetch(`${API_URL}?action=saveLetter&token=${API_TOKEN}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(letterData)
    });
    
    if (!response.ok) throw new Error('Gagal menyimpan surat');
    return await response.json();
}

function handleFilterSubmit(e) {
    e.preventDefault();
    const filters = {
        hrdName: document.getElementById('filterHRD').value,
        letterType: document.getElementById('filterJenis').value,
        letterDate: document.getElementById('filterDate').value
    };
    loadLetters(filters);
}

function handleViewLetter(e) {
    const letterId = e.currentTarget.getAttribute('data-id');
    alert(`Lihat detail surat ID: ${letterId}`);
    // Implementasi view detail
}

async function handleDeleteLetter(e) {
    if (!confirm('Apakah Anda yakin ingin menghapus surat ini?')) return;
    
    const letterId = e.currentTarget.getAttribute('data-id');
    try {
        const response = await fetch(`${API_URL}?action=deleteLetter&token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: letterId })
        });
        
        if (!response.ok) throw new Error('Gagal menghapus surat');
        
        alert('Surat berhasil dihapus');
        loadLetters();
    } catch (error) {
        console.error('Error:', error);
        alert(`Gagal menghapus surat: ${error.message}`);
    }
}

function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Populate dropdown (simulasi)
function populateDropdowns() {
    // Dalam implementasi nyata, ambil data dari GAS
    const hrdNames = ['Mursalim', 'Gerard Febrino A', 'M. Fauzan Abrar', 'M. Mohan P', 'M. Rizky Giyan'];
    const letterTypes = ['Surat Keterangan Kerja', 'Surat Pengalaman Kerja', 'Surat Dinas', 'Surat Tugas', 'Surat Peringatan'];
    
    const hrdSelect = document.getElementById('hrdName');
    const filterHrdSelect = document.getElementById('filterHRD');
    const letterTypeSelect = document.getElementById('letterType');
    const filterLetterTypeSelect = document.getElementById('filterJenis');
    
    hrdNames.forEach(name => {
        hrdSelect.add(new Option(name, name));
        filterHrdSelect.add(new Option(name, name));
    });
    
    letterTypes.forEach(type => {
        letterTypeSelect.add(new Option(type, type));
        filterLetterTypeSelect.add(new Option(type, type));
    });
}

// Tambahkan tombol refresh di HTML (jika belum ada)
// <button id="refreshBtn" class="btn btn-sm btn-outline-secondary ms-2"><i class="bi bi-arrow-clockwise"></i></button>