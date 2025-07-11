import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";

export default (...arguments_: Parameters<typeof convexQuery>) => useQuery(convexQuery(...arguments_));
