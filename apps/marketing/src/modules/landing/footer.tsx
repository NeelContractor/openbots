import Link from "next/link"
import Logo from "../shared/logo"

export default function Footer() {
  return (
    <footer className="border-t py-12 px-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Autonomous AI agents workspace with documents, schedules, and
            long-term memory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
          <Link
            href="https://github.com/NeelContractor/openbots"
            className="transition hover:text-foreground"
          >
            GitHub
          </Link>
          <Link
            href="https://github.com/NeelContractor/openbots/blob/main/DOCUMENTATION.md"
            className="transition hover:text-foreground"
          >
            Documentation
          </Link>
          <Link
            href="https://github.com/NeelContractor/openbots/blob/main/SELF_HOST.md"
            className="transition hover:text-foreground"
          >
            Self-Hosting
          </Link>
          <Link
            href="https://x.com/NeelContractor1"
            className="transition hover:text-foreground"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}
