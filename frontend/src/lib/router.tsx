import { forwardRef, useCallback } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate as useRouterNavigate,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";

type Destination = {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string | boolean | undefined>;
  replace?: boolean;
};
function href({ to, params, search }: Destination) {
  let path = to.replace(/\$(\w+)/g, (_, key: string) =>
    encodeURIComponent(params?.[key] || ""),
  );
  const query = new URLSearchParams();
  Object.entries(search || {}).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  if (query.size) path += `?${query}`;
  return path;
}
type LinkProps = Omit<RouterLinkProps, "to"> &
  Destination & {
    activeOptions?: { exact?: boolean };
    activeProps?: { className?: string };
  };
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, params, search, activeOptions, activeProps, className, ...rest },
  ref,
) {
  const { pathname } = useLocation();
  const destination = href({ to, params, search });
  const active = activeOptions?.exact
    ? pathname === to
    : pathname === to || (to !== "/" && pathname.startsWith(`${to}/`));
  return (
    <RouterLink
      ref={ref}
      to={destination}
      className={
        active && activeProps?.className ? activeProps.className : className
      }
      aria-current={active ? "page" : undefined}
      {...rest}
    />
  );
});
export function useNavigate() {
  const navigate = useRouterNavigate();
  return useCallback(
    (destination: Destination) =>
      navigate(href(destination), { replace: destination.replace }),
    [navigate],
  );
}
export function useRouterState<T>({
  select,
}: {
  select: (state: { location: { pathname: string; href: string } }) => T;
}) {
  const location = useLocation();
  return select({
    location: {
      pathname: location.pathname,
      href: location.pathname + location.search + location.hash,
    },
  });
}
