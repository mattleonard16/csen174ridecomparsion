declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    color?: string
    size?: string | number
    strokeWidth?: string | number
  }
  const LucideIcon: FC<LucideProps>
  export default LucideIcon

  export const MapPin: FC<LucideProps>
  export const Navigation2: FC<LucideProps>
  export const Loader2: FC<LucideProps>
  export const Locate: FC<LucideProps>
  export const Shield: FC<LucideProps>
  export const Bell: FC<LucideProps>
  export const X: FC<LucideProps>
  export const AlertCircle: FC<LucideProps>
  export const Share2: FC<LucideProps>
  export const Edit: FC<LucideProps>
  export const RotateCcw: FC<LucideProps>
}