import LoginForm from '@/components/LoginForm';

function getSafeRedirect(searchParams) {
  const redirect = searchParams?.redirect;

  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  return '/carrito';
}

export default function LoginPage({ searchParams }) {
  return <LoginForm redirectTo={getSafeRedirect(searchParams)} />;
}
