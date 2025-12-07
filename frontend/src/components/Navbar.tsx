import { Layout, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

type NavbarProps = {
  title?: string;
  logoSrc?: string;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  onMenuClick?: () => void; // Toggle sidebar
  showMenuButton?: boolean; // Hiển thị nút menu (trên mobile)
};

export default function Navbar({ title, logoSrc, rightContent, leftContent, onMenuClick, showMenuButton }: NavbarProps) {
  return (
    <Layout.Header className="navbar">
      <div className="navbar-left">
        {showMenuButton && onMenuClick && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            className="navbar-menu-button"
            aria-label="Toggle menu"
          />
        )}
        {leftContent}
        {logoSrc ? (
          <img className="navbar-logo" src={logoSrc} alt="Brand logo" />
        ) : null}
        {title ? <span className="navbar-title">{title}</span> : null}
      </div>
      <div className="navbar-right">{rightContent}</div>
    </Layout.Header>
  );
}


