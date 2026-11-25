export const ROLE_LABEL = {
  admin: 'Admin',
  manager: 'Manager Gudang',
  staff: 'Staff Gudang',
  supplier: 'Supplier',
};

export const PROCESS_METHODS = ['Natural', 'Semi-Washed', 'Full Washed', 'Wet-Hulled', 'Honey'];

export const PRODUCT_UNITS = ['kg', 'karung', 'box', 'pcs', 'liter'];

export const STOCK_STATUS = {
  out_of_stock: { label: 'Out of Stock', tone: 'gray' },
  severe: { label: 'Severe', tone: 'red' },
  low: { label: 'Low', tone: 'yellow' },
  normal: { label: 'Normal', tone: 'green' },
};

export const SUPPLY_STATUS = {
  pending: { label: 'Pending', tone: 'yellow' },
  confirmed: { label: 'Confirmed', tone: 'indigo' },
  rejected: { label: 'Rejected', tone: 'red' },
  in_transit: { label: 'In Transit', tone: 'blue' },
  arrived: { label: 'Arrived', tone: 'purple' },
  inspecting: { label: 'Inspecting', tone: 'yellow' },
  received: { label: 'Received', tone: 'green' },
  returned: { label: 'Returned', tone: 'red' },
};

export const SHIPMENT_STATUS = {
  in_transit: { label: 'In Transit', tone: 'blue' },
  arrived: { label: 'Arrived', tone: 'purple' },
  inspecting: { label: 'Inspecting', tone: 'yellow' },
  received: { label: 'Received', tone: 'green' },
  returned: { label: 'Returned', tone: 'red' },
};

export const TRX_STATUS = {
  pending: { label: 'Pending', tone: 'yellow' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  shipped: { label: 'Shipped', tone: 'blue' },
};

export const NAV = {
  admin: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/suppliers', label: 'Verifikasi Supplier', icon: 'truck' },
    { href: '/products', label: 'Kelola Produk', icon: 'box' },
    { href: '/categories', label: 'Kategori Kopi', icon: 'grid' },
    { href: '/users', label: 'Daftar Akun', icon: 'users' },
    { href: '/reports', label: 'Laporan & Audit', icon: 'folder' },
  ],
  manager: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/supply-orders', label: 'Permintaan Pasokan', icon: 'truck' },
    { href: '/transactions/in', label: 'Barang Masuk (IN)', icon: 'arrow-down' },
    { href: '/transactions/out', label: 'Barang Keluar (OUT)', icon: 'arrow-up' },
    { href: '/products', label: 'Kelola Produk', icon: 'box' },
    { href: '/categories', label: 'Kategori Kopi', icon: 'grid' },
    { href: '/reports', label: 'Laporan', icon: 'folder' },
  ],
  staff: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/inspections', label: 'Pemeriksaan Barang', icon: 'check' },
    { href: '/transactions/in', label: 'Barang Masuk (IN)', icon: 'arrow-down' },
    { href: '/transactions/out', label: 'Barang Keluar (OUT)', icon: 'arrow-up' },
    { href: '/products', label: 'Stok Produk', icon: 'box' },
  ],
  supplier: [
    { href: '/dashboard', label: 'Dashboard', icon: 'home' },
    { href: '/supply-orders', label: 'Permintaan Pasokan', icon: 'truck' },
    { href: '/shipments', label: 'Pengiriman Barang', icon: 'box' },
    { href: '/account', label: 'Kelola Akun', icon: 'user' },
  ],
};
