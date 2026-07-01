import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMapPin, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import {
  updateCustomerProfile,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress
} from '../api';
import '../styles/Profile.css';

export default function ProfilePage() {
  const { customer, isLoggedIn, updateCustomer } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'addresses'

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(''); // Main address
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Address Book States
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Address Modal Form States
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    if (customer) {
      setFullName(customer.fullName || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    }
  }, [customer, isLoggedIn, navigate]);

  useEffect(() => {
    if (isLoggedIn && customer && activeTab === 'addresses') {
      fetchAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isLoggedIn, customer]);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const data = await getCustomerAddresses(customer.id);
      setAddresses(data);
    } catch (err) {
      toast.error('Không thể tải danh sách địa chỉ.');
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setProfileLoading(true);
    try {
      const updateData = {
        fullName,
        phone,
        address,
      };

      if (password) {
        updateData.password = password;
      }

      const response = await updateCustomerProfile(customer.id, updateData);
      
      // Update local storage and auth context
      updateCustomer({
        fullName: response.customer.fullName,
        phone: response.customer.phone,
        address: response.customer.address
      });

      setPassword('');
      setConfirmPassword('');
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      toast.error(err.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setProfileLoading(false);
    }
  };

  const openAddAddressModal = () => {
    setEditingAddress(null);
    setReceiverName('');
    setReceiverPhone('');
    setAddressLine('');
    setIsDefault(false);
    setShowModal(true);
  };

  const openEditAddressModal = (addr) => {
    setEditingAddress(addr);
    setReceiverName(addr.receiverName);
    setReceiverPhone(addr.receiverPhone);
    setAddressLine(addr.addressLine);
    setIsDefault(addr.isDefault);
    setShowModal(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!receiverName.trim() || !receiverPhone.trim() || !addressLine.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin địa chỉ.');
      return;
    }

    setModalLoading(true);
    try {
      const addressData = {
        receiverName,
        receiverPhone,
        addressLine,
        isDefault
      };

      if (editingAddress) {
        // Edit existing
        await updateCustomerAddress(customer.id, editingAddress.id, addressData);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        // Add new
        await addCustomerAddress(customer.id, addressData);
        toast.success('Thêm địa chỉ thành công!');
      }

      setShowModal(false);
      fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Lưu địa chỉ thất bại.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      await deleteCustomerAddress(customer.id, addressId);
      toast.success('Xóa địa chỉ thành công!');
      fetchAddresses();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa địa chỉ.');
    }
  };

  if (!isLoggedIn || !customer) return null;

  return (
    <div className="profile-page" id="profile-page">
      <div className="container">
        <div className="profile-layout">
          {/* Sidebar */}
          <aside className="profile-sidebar">
            <div className="profile-user-summary">
              <div className="profile-user-avatar">
                <FiUser />
              </div>
              <div className="profile-user-name">{customer.fullName}</div>
              <div className="profile-user-email">{customer.email}</div>
            </div>

            <nav className="profile-menu">
              <button
                className={`profile-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <FiUser /> Thông tin tài khoản
              </button>
              <button
                className={`profile-menu-item ${activeTab === 'addresses' ? 'active' : ''}`}
                onClick={() => setActiveTab('addresses')}
              >
                <FiMapPin /> Sổ địa chỉ nhận hàng
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="profile-content">
            {activeTab === 'profile' ? (
              <div className="profile-info-section fade-in">
                <h2>Thông tin tài khoản</h2>
                <form onSubmit={handleUpdateProfile} className="auth-form">
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Địa chỉ Email</label>
                      <input type="email" value={customer.email} disabled style={{ background: 'var(--gray-100)', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Địa chỉ chính</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, đường, phường, quận..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu mới (bỏ trống nếu giữ nguyên)</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới..."
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                      {profileLoading ? 'Đang cập nhật...' : 'Cập nhật tài khoản'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="profile-addresses-section fade-in">
                <div className="addresses-header">
                  <h2>Sổ địa chỉ nhận hàng</h2>
                  <button onClick={openAddAddressModal} className="btn btn-primary btn-sm">
                    <FiPlus /> Thêm địa chỉ mới
                  </button>
                </div>

                {addressesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>Đang tải địa chỉ...</div>
                ) : addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-500)' }}>
                    Bạn chưa lưu địa chỉ giao hàng nào.
                  </div>
                ) : (
                  <div className="addresses-grid">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
                        <div className="address-info">
                          <div className="address-receiver">
                            <span className="address-name">{addr.receiverName}</span>
                            <span className="address-phone">{addr.receiverPhone}</span>
                            {addr.isDefault && (
                              <span className="address-badge">Mặc định</span>
                            )}
                          </div>
                          <div className="address-line">{addr.addressLine}</div>
                        </div>
                        <div className="address-actions">
                          <button
                            onClick={() => openEditAddressModal(addr)}
                            className="btn-icon"
                            title="Chỉnh sửa"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="btn-icon delete"
                            title="Xóa"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Address Form Modal */}
      {showModal && (
        <div className="address-modal-overlay">
          <div className="address-modal">
            <h3>{editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}</h3>
            <form onSubmit={handleSaveAddress} className="auth-form">
              <div className="form-group">
                <label>Tên người nhận</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nhập tên người nhận..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input
                  type="text"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="Nhập số điện thoại..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Địa chỉ nhận hàng</label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Nhập số nhà, ngõ, đường, quận, thành phố..."
                  required
                />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  id="defaultAddressCheck"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <label htmlFor="defaultAddressCheck" style={{ margin: 0, cursor: 'pointer' }}>Đặt làm địa chỉ mặc định</label>
              </div>

              <div className="form-actions" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                  disabled={modalLoading}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
