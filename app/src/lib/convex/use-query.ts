import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";

export default (...args: Parameters<typeof convexQuery>) => {
    return useQuery(convexQuery(...args));
};
