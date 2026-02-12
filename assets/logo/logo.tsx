import type { ImgHTMLAttributes } from "react";

const Logo = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt="Logo"
        width={147}
        height={40}
        className="h-10 w-auto object-contain"
        {...props}
      />
    </div>
  );
};

export default Logo;
