import type { SVGProps } from 'react'

/**
 * The application's icon set.
 *
 * Hand-drawn instead of a dependency: the set in use fits on one screen, and a
 * screen this small does not earn the weight of an icon package to draw it.
 * Every icon shares the same 24-unit grid and stroke width, so mixing them
 * never looks mismatched.
 */

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function base(size: number, props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...props,
  }
}

export function HomeIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M3 11.2 12 4l9 7.2" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

export function TicketIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M13 6.5v11" strokeDasharray="2 2.4" />
    </svg>
  )
}

export function UsersIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M8.5 11a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" />
      <path d="M2.75 19c.5-3.2 2.9-5 5.75-5s5.25 1.8 5.75 5" />
      <path d="M15.5 5.1a3.25 3.25 0 0 1 0 6.3" />
      <path d="M16 14.1c2.5.35 4.35 2 4.75 4.9" />
    </svg>
  )
}

export function ChartIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 19.5h16" />
      <rect x="6" y="12" width="3" height="6.2" rx="0.8" />
      <rect x="10.5" y="8.2" width="3" height="10" rx="0.8" />
      <rect x="15" y="4.8" width="3" height="13.4" rx="0.8" />
    </svg>
  )
}

export function LogOutIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
      <path d="M15.5 16.5 20 12l-4.5-4.5" />
      <path d="M20 12H9.5" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function SearchIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  )
}

export function MenuIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 6.5h16" />
      <path d="M4 12h16" />
      <path d="M4 17.5h16" />
    </svg>
  )
}

export function XIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="m5 5 14 14" />
      <path d="m19 5-14 14" />
    </svg>
  )
}

export function ShieldOffIcon({ size = 32, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4.5 5.6 12 3l7.5 2.6v5.4c0 4.6-2.9 8.2-7.5 10-1.6-.6-2.9-1.5-4-2.5" />
      <path d="M6.2 9.5c-.13.65-.2 1.34-.2 2.1 0 4.6 2.9 8.2 6 9.9" />
      <path d="M4 4l16 16" />
    </svg>
  )
}

export function InboxIcon({ size = 32, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4 13.2 6.8 5h10.4l2.8 8.2" />
      <path d="M4 13.2h5a1 1 0 0 1 .96.72l.4 1.36a1 1 0 0 0 .96.72h1.76a1 1 0 0 0 .96-.72l.4-1.36a1 1 0 0 1 .96-.72h5" />
      <path d="M4 13.2V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.8" />
    </svg>
  )
}

export function ClockIcon({ size = 14, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function ArrowLeftIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M19 12H5" />
      <path d="m10.5 6.5-5.5 5.5 5.5 5.5" />
    </svg>
  )
}

export function FlameIcon({ size = 13, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 21c-3.6 0-6.3-2.5-6.3-6 0-2.8 1.7-4.4 2.6-6.3.5 1 .9 1.7 1.5 2.1-.2-2.4.6-4.9 3-6.8 1 2.8.4 4.4 1.8 6.1 1 1.2 3.7 3 3.7 5 0 3.4-2.7 5.9-6.3 5.9Z" />
    </svg>
  )
}

export function AlertTriangleIcon({ size = 32, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M10.6 4.3 2.9 18a1.7 1.7 0 0 0 1.5 2.5h15.2a1.7 1.7 0 0 0 1.5-2.5L13.4 4.3a1.7 1.7 0 0 0-2.8 0Z" />
      <path d="M12 9.8v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

export function BuildingIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="5" y="3.5" width="10" height="17" rx="1" />
      <path d="M17 9h1.5a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H17" />
      <path d="M8.2 7.2h.01M11.8 7.2h.01M8.2 10.8h.01M11.8 10.8h.01M8.2 14.4h.01M11.8 14.4h.01" />
      <path d="M9 20.5v-3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3" />
    </svg>
  )
}

export function MailIcon({ size = 15, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" />
      <path d="m4.5 7 7 5.2L18.5 7" />
    </svg>
  )
}

export function KeyIcon({ size = 40, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="8" cy="15.5" r="3.5" />
      <path d="M10.5 13 18 5.5" />
      <path d="M15.5 8 18 5.5 20.5 8" />
      <path d="M14 9.5 16 11.5" />
    </svg>
  )
}

export function CheckCircleIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.3 12.2 2.4 2.4 5-5" />
    </svg>
  )
}

export function SparkleIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 3.5c.4 3 1.9 4.5 4.9 4.9-3 .4-4.5 1.9-4.9 4.9-.4-3-1.9-4.5-4.9-4.9 3-.4 4.5-1.9 4.9-4.9Z" />
      <path d="M18.7 14.3c.2 1.5.9 2.2 2.3 2.4-1.4.2-2.1.9-2.3 2.4-.2-1.5-.9-2.2-2.3-2.4 1.4-.2 2.1-.9 2.3-2.4Z" />
    </svg>
  )
}

export function LoaderIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg {...base(size, props)} className={['spin', props.className].filter(Boolean).join(' ')}>
      <path d="M12 3.5v3.2" opacity=".95" />
      <path d="M12 17.3v3.2" opacity=".35" />
      <path d="M18.5 5.5l-2.3 2.3" opacity=".6" />
      <path d="M7.8 16.2l-2.3 2.3" opacity=".2" />
      <path d="M20.5 12h-3.2" opacity=".8" />
      <path d="M6.7 12H3.5" opacity=".45" />
      <path d="M18.5 18.5l-2.3-2.3" opacity=".1" />
      <path d="M7.8 7.8 5.5 5.5" opacity=".7" />
    </svg>
  )
}
