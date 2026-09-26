import { cn } from "@/lib/utils"

type AppContainerVariant = "wide" | "compact" | "settings" | "account" | "calculator"

type AppContainerProps = {
  children: React.ReactNode
  className?: string
  variant?: AppContainerVariant
}

const variantClasses: Record<AppContainerVariant, string> = {
  wide: "w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
  compact: "w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
  settings: "w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
  account: "w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
  calculator: "w-full min-w-0 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
}

export default function AppContainer({ children, className, variant = "wide" }: AppContainerProps) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      {children}
    </div>
  )
}