import React, { useState } from "react";
import {
  FaHome, FaUserFriends, FaTruck, FaMoneyCheckAlt, FaMoneyBillWave, FaCity, FaMapMarkerAlt, FaCalendarAlt, FaUserTie,
  FaExchangeAlt, FaFileContract, FaUnlockAlt, FaFileInvoiceDollar, FaFileAlt, FaFileSignature, FaSignOutAlt, FaWhatsapp
} from "react-icons/fa";
import { MdMenu } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const menuData = [
  {
    title: "Home",
    icon: <FaHome />,
    path: "/"
  },
  {
    title: "Cadastros",
    icon: <FaUserFriends />,
    submenus: [
      { title: "Clientes", icon: <FaUserFriends />, path: "/clientes" },
      { title: "WhatsApp", icon: <FaWhatsapp />, path: "/whatsapp" },
      { title: "Planos de Pagamentos", icon: <FaFileSignature />, path: "/planos-pagamentos" },
      { title: "Fornecedores", icon: <FaTruck />, path: "/fornecedores" },
      { title: "Contas à Pagar", icon: <FaMoneyCheckAlt />, path: "/contas-pagar" },
      { title: "Contas à Receber", icon: <FaMoneyBillWave />, path: "/contas-receber" },
      { title: "Cidades", icon: <FaCity />, path: "/cidades" },
      { title: "Bairros", icon: <FaMapMarkerAlt />, path: "/bairros" },
      { title: "Feriados", icon: <FaCalendarAlt />, path: "/feriados" },
      { title: "Funcionários", icon: <FaUserTie />, path: "/funcionarios" },
    ],
  },
  {
    title: "Movimentação",
    icon: <FaExchangeAlt />,
    submenus: [
      { title: "Contratos", icon: <FaFileContract />, path: "/contratos" },
      { title: "Recebimentos", icon: <FaMoneyBillWave />, path: "/recebimentos" },
      { title: "Pagamentos", icon: <FaMoneyCheckAlt />, path: "/pagamentos" },
      { title: "Desbloqueio", icon: <FaUnlockAlt />, path: "/desbloqueio" },
    ],
  },
  {
    title: "Relatórios",
    icon: <FaFileAlt />,
    submenus: [
      { title: "Recebimentos", icon: <FaFileInvoiceDollar />, path: "/relatorios/recebimentos" },
      { title: "Pagamentos", icon: <FaMoneyCheckAlt />, path: "/relatorios/pagamentos" },
      { title: "Clientes", icon: <FaUserFriends />, path: "/relatorios/clientes" },
      { title: "Contratos", icon: <FaFileContract />, path: "/relatorios/contratos" },
    ],
  },
];

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

export default function Sidebar({ onCollapse }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const width = useWindowWidth();
  const isMobile = width <= 768;

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCollapse = () => {
    setCollapsed((prev) => {
      if (onCollapse) onCollapse(!prev);
      return !prev;
    });
    setOpenIndex(null);
    if (isMobile) setShowMobileMenu((prev) => !prev);
  };

  const handleMenuClick = (menu, idx) => {
    if (menu.path) {
      navigate(menu.path);
      setOpenIndex(null);
      if (isMobile) setShowMobileMenu(false);
    } else {
      handleToggle(idx - 1);
    }
  };

  const handleSubmenuClick = (submenu) => {
    if (submenu.path) {
      navigate(submenu.path);
      if (isMobile) setShowMobileMenu(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("rememberedUser");
    navigate("/login");
  };

  // Drawer mobile
  const drawer = (
    <>
      <div className="sidebar-drawer-overlay" onClick={() => setShowMobileMenu(false)} />
      <div className="sidebar-drawer-mobile">
        <ul className="sidebar-menu">
          {menuData.map((menu, idx) => (
            <li key={menu.title}>
              <div
                className={`sidebar-menu-item ${openIndex === idx - 1 ? "open" : ""}`}
                onClick={() => idx === 0 ? handleMenuClick(menu, idx) : handleMenuClick(menu, idx)}
                title={menu.title}
                style={{ fontWeight: 'normal', gap: 0 }}
              >
                <span className="sidebar-icon">{menu.icon}</span>
                <span>{menu.title}</span>
                {idx !== 0 && menu.submenus && (
                  <span className="sidebar-arrow">{openIndex === idx - 1 ? "▲" : "▼"}</span>
                )}
              </div>
              {idx !== 0 && menu.submenus && (
                <ul className={`sidebar-submenu ${openIndex === idx - 1 ? "show" : ""}`}>
                  {menu.submenus.map((submenu) => (
                    <li key={submenu.title} onClick={() => handleSubmenuClick(submenu)} style={{cursor: submenu.path ? 'pointer' : 'default', fontWeight: 'normal', gap: 0}}>
                      <span className="sidebar-icon">{submenu.icon}</span>
                      <span>{submenu.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
          {/* Botão Sair no mobile */}
          <li>
            <div
              className="sidebar-menu-item logout-item"
              onClick={handleLogout}
              title="Sair"
              style={{ 
                fontWeight: 'normal', 
                gap: 0, 
                color: '#ff6b6b',
                borderTop: '1px solid #444',
                marginTop: '20px'
              }}
            >
              <span className="sidebar-icon"><FaSignOutAlt /></span>
              <span>Sair</span>
            </div>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      <div className={`sidebar${collapsed ? " collapsed" : ""}`}>
        <div className="sidebar-title">
          <button className="sidebar-toggle-btn" onClick={handleCollapse}>
            <MdMenu size={28} color="#fff" />
          </button>
          {!collapsed && <span>Menu</span>}
        </div>
        {!isMobile && (
          <ul className="sidebar-menu">
            {menuData.map((menu, idx) => (
              <li key={menu.title}>
                <div
                  className={`sidebar-menu-item ${openIndex === idx - 1 ? "open" : ""}`}
                  onClick={() => idx === 0 ? handleMenuClick(menu, idx) : !collapsed && handleMenuClick(menu, idx)}
                  title={collapsed ? menu.title : undefined}
                  style={{ fontWeight: 'normal', gap: 0 }}
                >
                  <span className="sidebar-icon">{menu.icon}</span>
                  {!collapsed && <span>{menu.title}</span>}
                  {!collapsed && idx !== 0 && menu.submenus && (
                    <span className="sidebar-arrow">{openIndex === idx - 1 ? "▲" : "▼"}</span>
                  )}
                </div>
                {!collapsed && idx !== 0 && menu.submenus && (
                  <ul className={`sidebar-submenu ${openIndex === idx - 1 ? "show" : ""}`}>
                    {menu.submenus.map((submenu) => (
                      <li key={submenu.title} onClick={() => handleSubmenuClick(submenu)} style={{cursor: submenu.path ? 'pointer' : 'default', fontWeight: 'normal', gap: 0}}>
                        <span className="sidebar-icon">{submenu.icon}</span>
                        <span>{submenu.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {/* Botão Sair */}
            <li>
              <div
                className="sidebar-menu-item logout-item"
                onClick={!collapsed ? handleLogout : undefined}
                title={collapsed ? "Sair" : undefined}
                style={{ 
                  fontWeight: 'normal', 
                  gap: 0, 
                  color: '#ff6b6b',
                  borderTop: '1px solid #444',
                  marginTop: '20px',
                  cursor: !collapsed ? 'pointer' : 'default'
                }}
              >
                <span className="sidebar-icon"><FaSignOutAlt /></span>
                {!collapsed && <span>Sair</span>}
              </div>
            </li>
          </ul>
        )}
      </div>
      {isMobile && showMobileMenu && drawer}
    </>
  );
}