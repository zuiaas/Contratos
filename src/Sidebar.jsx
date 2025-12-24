import React, { useState } from "react";
import {
  FaHome, FaUserFriends, FaTruck, FaMoneyCheckAlt, FaMoneyBillWave, FaCity, FaMapMarkerAlt, FaCalendarAlt, FaUserTie,
  FaExchangeAlt, FaFileContract, FaUnlockAlt, FaFileInvoiceDollar, FaFileAlt, FaFileSignature, FaSignOutAlt, FaWhatsapp,
  FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { MdMenu, MdClose } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";

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
    <div className={`flex flex-col h-full bg-slate-900 text-slate-300 ${!isMobileMode && collapsed ? 'w-20' : 'w-72'} transition-all duration-300 border-r border-slate-800`}>
      {/* Header */}
      <div className={`h-16 flex items-center ${collapsed && !isMobileMode ? 'justify-center' : 'justify-between px-6'} border-b border-slate-800 bg-slate-950`}>
        {!collapsed && !isMobileMode && (
          <div className="flex items-center space-x-2 font-bold text-xl text-white tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white text-lg">C</span>
            </div>
            <span>Contratos</span>
          </div>
        )}
        {isMobileMode && (
          <div className="flex items-center space-x-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              C
            </div>
            <span>Menu</span>
          </div>
        )}

        <button
          onClick={isMobileMode ? () => setShowMobileMenu(false) : handleCollapse}
          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMode ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1">
          {menuData.map((menu, idx) => {
            const isOpen = openIndex === idx - 1;
            const isItemActive = menu.path ? isActive(menu.path) : false;

            return (
              <li key={menu.title} className="px-3">
                <div
                  onClick={() => handleMenuClick(menu, idx)}
                  className={`
                      flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group
                      ${isItemActive
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20"
                      : "hover:bg-slate-800 hover:text-white"}
                      ${collapsed && !isMobileMode ? "justify-center" : "justify-between"}
                    `}
                  title={menu.title}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl ${isItemActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                      {menu.icon}
                    </span>
                    {(!collapsed || isMobileMode) && (
                      <span className="text-sm font-medium">{menu.title}</span>
                    )}
                  </div>
                  {(!collapsed || isMobileMode) && menu.submenus && (
                    <span className="text-xs text-slate-500">
                      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  )}
                </div>

                {/* Submenu */}
                {(!collapsed || isMobileMode) && menu.submenus && (
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 mt-1 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <ul className="pl-4 space-y-1 border-l-2 border-slate-800 ml-5 my-1">
                      {menu.submenus.map((submenu) => (
                        <li
                          key={submenu.title}
                          onClick={(e) => { e.stopPropagation(); handleSubmenuClick(submenu); }}
                          className={`
                                flex items-center gap-3 p-2 rounded-lg text-sm cursor-pointer transition-colors
                                ${isActive(submenu.path) ? "text-blue-400 font-medium bg-blue-500/10" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}
                            `}
                        >
                          {/* Mini icon or dot for submenu could go here */}
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

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full p-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all group ${collapsed && !isMobileMode ? 'justify-center' : ''}`}
          title="Sair"
        >
          <span className="text-xl group-hover:scale-110 transition-transform"><FaSignOutAlt /></span>
          {(!collapsed || isMobileMode) && <span className="ml-3 text-sm font-medium">Sair do Sistema</span>}
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
      <div className="fixed top-0 left-0 w-full h-16 bg-slate-900 z-50 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center space-x-3 font-bold text-white">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">C</span>
          </div>
          <span>Contratos</span>
        </div>
        <button
          onClick={() => setShowMobileMenu(true)}
          className="p-2 text-white bg-slate-800 rounded-lg"
        >
          <MdMenu size={24} />
        </button>
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