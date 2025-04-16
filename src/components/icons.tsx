
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Command,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  LucideProps,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Settings,
  SunMedium,
  Trash,
  User,
  X,
} from "lucide-react"

export type Icon = React.ComponentType<React.ComponentProps<"svg">>

export const Icons = {
  logo: Command,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  settings: Settings,
  user: User,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  creditCard: CreditCard,
  file: File,
  fileText: FileText,
  plus: Plus,
  arrowRight: ArrowRight,
  help: HelpCircle,
  image: Image,
  clipboardCheck: ClipboardCheck,
  warning: AlertTriangle,
  close: X,
  check: Check,
  moreVertical: MoreVertical,
  pizza: Pizza,
}
