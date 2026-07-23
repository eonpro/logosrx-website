export const clerkDarkAppearance = {
  // Dark theme palette via Clerk's supported `variables` API. This replaces the
  // previous hand-written CSS that forced colors on Clerk's internal hashed
  // classes (e.g. `.cl-internal-b3fm6y`, `[class*="cl-internal"]`) — selectors
  // Clerk explicitly warns can break on component updates. Both legacy and new
  // (@clerk/ui v1) variable names are included; unknown keys are ignored.
  variables: {
    colorPrimary: "#C62E88",
    colorText: "#ffffff",
    colorForeground: "#ffffff",
    colorTextSecondary: "rgba(255,255,255,0.6)",
    colorMutedForeground: "rgba(255,255,255,0.6)",
    colorTextOnPrimaryBackground: "#ffffff",
    colorPrimaryForeground: "#ffffff",
    colorBackground: "transparent",
    colorInputText: "#ffffff",
    colorInputForeground: "#ffffff",
    colorInputBackground: "rgba(255,255,255,0.05)",
    colorInput: "rgba(255,255,255,0.05)",
    colorNeutral: "#ffffff",
    colorDanger: "#fca5a5",
  },
  elements: {
    rootBox: "w-full clerk-dark-form",
    cardBox: "!shadow-none w-full !border-0 !bg-transparent !rounded-none",
    card: "!shadow-none w-full !p-0 !bg-transparent !border-0 !rounded-none gap-5",
    // Clerk's internal styles beat plain Tailwind `hidden` (display:flex wins),
    // so force-hide with `!hidden` — otherwise a second app logo leaks above the form.
    header: "!hidden",
    headerTitle: "!hidden",
    headerSubtitle: "!hidden",
    logoBox: "!hidden",
    logoImage: "!hidden",
    socialButtonsBlockButton:
      "!border !border-white/10 !bg-white/5 hover:!bg-white/10 transition-all duration-200 !text-white/90 font-medium !rounded-xl !h-12",
    socialButtonsBlockButtonText: "!text-white/90 font-medium !text-[14px]",
    socialButtonsBlockButtonArrow: "!text-white/40",
    dividerLine: "!bg-white/8",
    dividerText: "!text-white/40 !text-xs uppercase tracking-[0.15em]",
    formFieldLabel:
      "!text-white/55 font-medium !text-xs uppercase tracking-wider",
    formFieldInput:
      "!border-white/10 !bg-white/5 focus:!border-magenta focus:!ring-1 focus:!ring-magenta/30 !rounded-xl !h-12 !text-white placeholder:!text-white/20",
    formFieldInputShowPasswordButton: "!text-white/30 hover:!text-white/60",
    formButtonPrimary:
      "!bg-gradient-to-r !from-magenta !to-magenta-dark hover:!from-magenta-dark hover:!to-magenta !text-white font-semibold !rounded-xl !shadow-[0_0_24px_rgba(198,46,136,0.3)] hover:!shadow-[0_0_32px_rgba(198,46,136,0.5)] transition-all duration-300 !h-12 !text-[15px]",
    footerAction: "!hidden",
    footer: "!hidden",
    footerActionLink: "!hidden",
    footerActionText: "!hidden",
    footerPages: "!hidden",
    footerPagesLink: "!hidden",
    formFieldAction: "!text-magenta-light hover:!text-magenta !text-xs",
    identityPreviewEditButton: "!text-magenta-light hover:!text-magenta",
    identityPreviewText: "!text-white/70",
    formResendCodeLink: "!text-magenta-light hover:!text-magenta",
    alert: "!bg-red-500/10 !border !border-red-500/20 !text-red-300 !rounded-xl",
    alertText: "!text-red-300",
    otpCodeFieldInput: "!border-white/10 !bg-white/5 !text-white !rounded-lg",
    formHeaderTitle: "!text-white",
    formHeaderSubtitle: "!text-white/50",
    backLink: "!text-magenta-light hover:!text-magenta",
    phoneInputBox: "!border-white/10 !bg-white/5 !rounded-xl",
    formFieldInputGroup: "!border-white/10 !bg-white/5 !rounded-xl",
    formFieldInput__phoneNumber:
      "!text-white !border-white/10 !bg-transparent placeholder:!text-white/25",
    selectButton: "!text-white/70 !border-white/10 hover:!bg-white/10",
    selectButton__phoneCode: "!text-white/70",
    selectButtonIcon: "!text-white/50",
    alternativeMethodsBlockButton:
      "!text-white/60 !border-white/10 hover:!bg-white/5 hover:!text-white",
    selectSearchInput:
      "!text-white !bg-white/5 !border-white/10 placeholder:!text-white/30",
    selectOptionsContainer: "!bg-[#1a1750] !border-white/10 !rounded-xl",
    selectOption: "!text-white/70 hover:!bg-white/10 hover:!text-white",
  },
} as const;
