const arrowIcon = { src: "/arrow.png" };
const magnifyingGlassIcon = { src: "/magnifying-glass.png" };
const newMessageIcon = { src: "/new-message.png" };
const sidebarIcon = { src: "/sidebar.png" };
const nexaLogoIcon = { src: "/nexa-logo.png" };

type IconProps = {
  className?: string;
};

export function IconNewChat({ className = "h-4 w-4" }: IconProps) {
  return <img src={newMessageIcon.src} alt="" className={[className, "object-contain opacity-90"].join(" ")} />;
}

export function IconSearch({ className = "h-4 w-4" }: IconProps) {
  return (
    <img src={magnifyingGlassIcon.src} alt="" className={[className, "object-contain opacity-80"].join(" ")} />
  );
}

export function IconImages({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M5.5 19h13A2.5 2.5 0 0 0 21 16.5v-9A2.5 2.5 0 0 0 18.5 5h-13A2.5 2.5 0 0 0 3 7.5v9A2.5 2.5 0 0 0 5.5 19Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m4.5 15 3.3-3.3a1.6 1.6 0 0 1 2.3 0l2.1 2.1 1.3-1.3a1.6 1.6 0 0 1 2.3 0L19.5 16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 9.25h.01"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconSidebar({ className = "h-4 w-4" }: IconProps) {
  return <img src={sidebarIcon.src} alt="" className={[className, "object-contain opacity-80"].join(" ")} />;
}

export function IconSend({ className = "h-7 w-7" }: IconProps) {
  return <img src={arrowIcon.src} alt="" className={[className, "object-contain"].join(" ")} />;
}

export function IconChevronDown({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
      <path d="M8 10.5L3.5 6h9L8 10.5z" />
    </svg>
  );
}

/** Assistant avatar in the message thread. */
export function NexaMark({ className = "h-7 w-7" }: IconProps) {
  return (
    <img
      src={nexaLogoIcon.src}
      alt=""
      className={[className, "rounded-sm object-contain"].join(" ")}
    />
  );
}
