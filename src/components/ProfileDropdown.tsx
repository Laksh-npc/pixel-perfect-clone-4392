import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useBalance } from "@/hooks/useBalance";

interface ProfileDropdownProps {
  profileImage?: string;
}

const ProfileDropdown = ({ profileImage = "/profile-icon.png" }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { balance } = useBalance();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleBalanceClick = () => {
    setIsOpen(false);
    navigate("/balance");
  };

  const handleLogout = () => {
    setIsOpen(false);
    // Dummy logout - can be implemented later
    console.log("Logout clicked");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-full overflow-hidden hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center rounded-full">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/40"></div>
            </div>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
          {/* Profile Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white/20"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Aditya Chawla
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  adichawla2009@gmail.com
                </div>
              </div>
              <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Balance Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Stocks, F&O balance
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleBalanceClick}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"></div>
              </div>
              Balance
            </button>
            <button
              onClick={toggleTheme}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Switch to light mode
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  Dark mode
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;

