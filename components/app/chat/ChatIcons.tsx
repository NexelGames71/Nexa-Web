import arrowIcon from "../../../assets/arrow.png";
import magnifyingGlassIcon from "../../../assets/magnifying-glass.png";
import newMessageIcon from "../../../assets/new-message.png";
import sidebarIcon from "../../../assets/sidebar.png";
import thinkingIcon from "../../../assets/thinking.png";

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

/** Assistant avatar in the message thread (thinking icon from assets). */
export function NexaMark({ className = "h-7 w-7" }: IconProps) {
  return (
    <img
      src={thinkingIcon.src}
      alt=""
      className={[className, "rounded-sm object-contain"].join(" ")}
    />
  );
}
