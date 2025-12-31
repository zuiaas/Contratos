import React, { useState } from "react";
import {
  FaHome, FaUserFriends, FaTruck, FaMoneyCheckAlt, FaMoneyBillWave, FaCity, FaMapMarkerAlt, FaCalendarAlt, FaUserTie,
  FaExchangeAlt, FaFileContract, FaUnlockAlt, FaFileInvoiceDollar, FaFileAlt, FaFileSignature, FaSignOutAlt, FaWhatsapp,
  FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { MdMenu, MdClose } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

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

export default function Sidebar({ onCollapse, theme, toggleTheme }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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

  const isActive = (path) => location.pathname === path;

  // Sidebar Items component for reuse
  const SidebarContent = ({ isMobileMode = false }) => (
    <div className={`
      flex flex-col h-full 
      bg-card/95 backdrop-blur-md
      text-foreground
      ${!isMobileMode && collapsed ? 'w-20' : 'w-72'} 
      transition-all duration-300 
      border-r border-border
      shadow-sm
    `}>
      {/* Header */}
      <div className={`
        h-16 flex items-center 
        ${collapsed && !isMobileMode ? 'justify-center' : 'justify-between px-6'} 
        border-b border-border
        bg-secondary/30
      `}>
        {!collapsed && !isMobileMode && (
          <div className="flex items-center space-x-3 font-bold text-xl text-foreground tracking-tight">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <span className="text-primary text-lg font-bold">C</span>
            </div>
            <span>Contratos</span>
          </div>
        )}
        {isMobileMode && (
          <div className="flex items-center space-x-3 font-bold text-xl text-foreground">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <span className="text-primary text-lg font-bold">C</span>
            </div>
            <span>Menu</span>
          </div>
        )}

        <button
          onClick={isMobileMode ? () => setShowMobileMenu(false) : handleCollapse}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMobileMode ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuData.map((menu, idx) => {
            const isOpen = openIndex === idx - 1;
            const isItemActive = menu.path ? isActive(menu.path) : false;

            return (
              <li key={menu.title}>
                <div
                  onClick={() => handleMenuClick(menu, idx)}
                  className={`
                    flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group
                    ${isItemActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent hover:text-foreground text-muted-foreground"
                    }
                    ${collapsed && !isMobileMode ? "justify-center" : "justify-between"}
                  `}
                  title={menu.title}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg transition-colors ${isItemActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}>
                      {menu.icon}
                    </span>
                    {(!collapsed || isMobileMode) && (
                      <span className="text-sm">{menu.title}</span>
                    )}
                  </div>
                  {(!collapsed || isMobileMode) && menu.submenus && (
                    <span className={`text-xs transition-transform duration-200 text-muted-foreground ${isOpen ? 'rotate-180' : ''}`}>
                      <FaChevronDown />
                    </span>
                  )}
                </div>

                {/* Submenu */}
                {(!collapsed || isMobileMode) && menu.submenus && (
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="pl-4 space-y-1 border-l border-border ml-6 my-1">
                      {menu.submenus.map((submenu) => (
                        <li
                          key={submenu.title}
                          onClick={(e) => { e.stopPropagation(); handleSubmenuClick(submenu); }}
                          className={`
                            flex items-center gap-3 p-2 rounded-md text-sm cursor-pointer transition-all duration-150
                            ${isActive(submenu.path)
                              ? "text-primary font-medium bg-primary/5 -ml-[1px] border-l-2 border-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            }
                          `}
                        >
                          <span>{submenu.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer / Theme Toggle & Logout */}
      <div className="p-4 border-t border-border bg-secondary/30 space-y-2">
        {/* Theme Toggle */}
        {(!collapsed || isMobileMode) && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tema</span>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        )}

        {collapsed && !isMobileMode && (
          <div className="flex justify-center mb-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`
            flex items-center w-full p-2.5 rounded-lg
            text-muted-foreground
            hover:bg-destructive/10 hover:text-destructive
            transition-all group 
            ${collapsed && !isMobileMode ? 'justify-center' : ''}
          `}
          title="Sair"
        >
          <span className="text-lg transition-transform group-hover:scale-110"><FaSignOutAlt /></span>
          {(!collapsed || isMobileMode) && <span className="ml-3 text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside className={`fixed h-screen z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
        <SidebarContent />
      </aside>
    );
  }

  // Mobile Topbar & Drawer
  return (
    <>
      <div className="fixed top-0 left-0 w-full h-16 bg-card/95 backdrop-blur-md z-50 flex items-center justify-between px-4 shadow-sm border-b border-border">
        <div className="flex items-center space-x-3 font-bold text-foreground">
          <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
            <span className="text-primary text-lg font-bold">C</span>
          </div>
          <span>Contratos</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <button
            onClick={() => setShowMobileMenu(true)}
            className="p-2 text-muted-foreground bg-secondary/50 rounded-lg hover:bg-accent hover:text-foreground transition-colors"
          >
            <MdMenu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="flex-none w-72 h-full shadow-2xl animate-slide-in">
            <SidebarContent isMobileMode={true} />
          </div>
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
        </div>
      )}
    </>
  );
}