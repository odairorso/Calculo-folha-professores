import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        className
      )}
    >
      {theme === "light" ? (
        <Sun className="w-5 h-5 shrink-0" />
      ) : (
        <Moon className="w-5 h-5 shrink-0" />
      )}
      {!collapsed && (
        <span>{theme === "light" ? "Modo Claro" : "Modo Escuro"}</span>
      )}
    </Button>
  )
}
