export function HeroFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden" aria-hidden="true">
      <div className="absolute size-[min(88vw,54rem)] rounded-full border border-white/10 opacity-60 [background:radial-gradient(circle_at_34%_28%,rgb(243_241_234/32%),rgb(163_163_163/9%)_22%,rgb(20_20_20/0%)_64%)]" />
      <div className="relative aspect-square w-[min(66vw,34rem)] rotate-[-14deg] rounded-[42%_58%_48%_52%/58%_38%_62%_42%] border border-white/15 bg-[radial-gradient(circle_at_36%_26%,rgb(243_241_234/52%),rgb(163_163_163/16%)_23%,rgb(20_20_20/92%)_58%,rgb(9_9_9)_78%)] shadow-[inset_-3rem_-4rem_7rem_rgb(0_0_0/70%),0_3rem_8rem_rgb(0_0_0/45%)] sm:w-[min(58vw,38rem)]" />
      <div className="absolute h-px w-[min(72vw,48rem)] rotate-[18deg] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );
}
