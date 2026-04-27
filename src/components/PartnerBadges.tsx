import Image from "next/image";

export function PartnerBadges() {
  return (
    <div className="flex items-center gap-0.5">
      {/* Tajau Logo */}
      <div className="relative h-8 sm:h-10 w-[92px] sm:w-[110px]">
        <Image src="/images/tajau-logo.png" alt="Tajau" fill className="object-contain" sizes="110px" priority />
      </div>
      {/* Swinburne Logo */}
      <div className="relative h-6 sm:h-8 w-[75px] sm:w-[90px]">
        <Image src="/images/swinburne-logo.jpg" alt="Swinburne" fill className="object-contain" sizes="90px" priority />
      </div>
    </div>
  );
}