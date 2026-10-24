import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold " +
    "transition-[transform,box-shadow,background-color,color] duration-200 ease-out " +
    "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] " +
    "disabled:pointer-events-none disabled:border-transparent disabled:bg-slate-light disabled:text-slate-dark disabled:shadow-none " +
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // Primary: Emerald fill, Ink text (7.63:1)
        default: "border-[1.5px] border-emerald-dark bg-brand-emerald text-ink active:bg-emerald-dark active:text-white",
        // Secondary: Violet fill, White text (7.07:1)
        secondary: "bg-brand-violet text-white active:bg-violet-deep",
        // Outline: flowing border instead of a solid one
        outline:
          "flow-border flow-on-hover flow-deep [--flow-radius:12px] [--flow-width:2px] bg-white text-brand-violet hover:bg-violet-light",
        ghost: "bg-transparent text-brand-violet hover:translate-y-0 hover:shadow-none hover:underline hover:underline-offset-4",
        destructive: "bg-error text-white active:brightness-90",
        // For use on solid Emerald / Violet sections
        light: "bg-white text-ink",
        lightViolet: "bg-white text-brand-violet",
        link: "text-emerald-dark underline-offset-4 hover:translate-y-0 hover:shadow-none hover:underline",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4 text-sm",
        lg: "h-[52px] px-8 text-lg",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
