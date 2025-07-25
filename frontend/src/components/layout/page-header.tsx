import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";

interface AccountPageHeaderProps {
  title: string;
  description?: string;
  includeButton?: boolean;
  buttonTitle?: string;
  buttonLink?: string;
  buttonIcon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  includeButton,
  buttonTitle,
  buttonLink,
  buttonIcon,
  actions,
}: AccountPageHeaderProps) => {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions ? (
          actions
        ) : (
          includeButton && buttonIcon && (
            <>
              <Link
                href={buttonLink ? buttonLink : "#"}
                className={cn(buttonVariants(), "text-xs md:text-sm")}
              >
                {buttonIcon} {buttonTitle}
              </Link>
            </>
          )
        )}
      </div>
    </div>
  );
};
