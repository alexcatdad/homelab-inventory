export default {
  providers: [
    {
      // @convex-dev/auth uses the Convex deployment as its own auth provider
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
