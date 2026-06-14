import Image from "next/image";
import watchlineLogo from "@/app/watchline_logo.webp";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={compact ? "max-md:flex max-md:justify-center" : ""}
      aria-label="WatchLine"
    >
      <span
        className={`relative block overflow-hidden rounded-lg  ${
          compact
            ? "h-11 w-[184px] max-md:h-11 max-md:w-11"
            : "h-12 w-[200px]"
        }`}
      >
        <Image
          alt="WatchLine"
          className={
            compact
              ? "h-full w-full object-cover max-md:absolute max-md:left-0 max-md:top-1/2 max-md:h-36 max-md:w-36 max-md:max-w-none max-md:-translate-y-1/2"
              : "h-full w-full object-cover"
          }
          priority
          src={watchlineLogo}
        />
      </span>
    </div>
  );
}
