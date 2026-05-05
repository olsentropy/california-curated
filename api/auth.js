// OAuth bridge for Sveltia/Decap CMS — step 1 of 2.
// Initiates the GitHub OAuth flow by redirecting the user to GitHub's
// authorize page with the appropriate parameters.
//
// Required Vercel environment variables:
//   GITHUB_CLIENT_ID     — from your GitHub OAuth App
//   GITHUB_CLIENT_SECRET — from your GitHub OAuth App (used in callback.js)

export default function handler(req, res) {
	const clientId = process.env.GITHUB_CLIENT_ID;
	if (!clientId) {
		res.statusCode = 500;
		return res.end(
			'Server misconfiguration: GITHUB_CLIENT_ID is not set in Vercel environment variables.',
		);
	}

	// Build the redirect URI dynamically based on this request's host.
	const proto = req.headers['x-forwarded-proto'] || 'https';
	const host = req.headers['x-forwarded-host'] || req.headers.host;
	const redirectUri = `${proto}://${host}/api/callback`;

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: 'repo,user',
		state: Math.random().toString(36).slice(2) + Date.now().toString(36),
	});

	res.writeHead(302, {
		Location: `https://github.com/login/oauth/authorize?${params}`,
	});
	res.end();
}
