import { useNavigate } from '@solidjs/router';

export default function ChangelogRedirect() {
  const navigate = useNavigate();
  navigate('/get-started/changelog', { replace: true });
  return null;
}
