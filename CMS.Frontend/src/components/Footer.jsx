import { Link } from 'react-router-dom';
import { FaPaw } from 'react-icons/fa';
import { FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import '../styles/Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">

                    <div className="footer-brand">
                        <div className="footer-logo">
                            <div className="footer-logo-icon">
                                <FaPaw />
                            </div>
                            Pet<span>Shop</span>
                        </div>

                        <p>
                            PetShop - Cửa hàng thú cưng uy tín, chuyên cung cấp thức ăn,
                            phụ kiện và các sản phẩm chăm sóc cho chó, mèo với chất lượng
                            tốt và giá cả hợp lý.
                        </p>

                        <div className="footer-socials">
                            <a href="#facebook" className="footer-social-link" aria-label="Facebook">
                                <FiFacebook />
                            </a>

                            <a href="#instagram" className="footer-social-link" aria-label="Instagram">
                                <FiInstagram />
                            </a>

                            <a href="#youtube" className="footer-social-link" aria-label="Youtube">
                                <FiYoutube />
                            </a>
                        </div>
                    </div>

                    <div className="footer-section">
                        <h4>Hỗ trợ</h4>
                        <Link to="/blog">Tin tức</Link>
                        <a href="#policy">Chính sách đổi trả</a>
                        <a href="#warranty">Chính sách bảo hành</a>
                        <a href="#faq">Câu hỏi thường gặp</a>
                    </div>

                    <div className="footer-section">
                        <h4>Liên hệ</h4>
                        <a href="tel:0336671981">0336 671 981</a>
                        <a href="mailto:petshop@gmail.com">petshop@gmail.com</a>
                        <a href="#address">TP. Hồ Chí Minh</a>
                    </div>

                </div>

                <div className="footer-bottom">
                    <p>
                        © 2026 <span>PetShop</span>. All rights reserved.
                    </p>
                    <p>Powered by PetShop</p>
                </div>
            </div>
        </footer>
    );
}