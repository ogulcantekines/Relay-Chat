import { useState } from 'react';
import { Link } from 'react-router-dom';
import useLogin from '../../hooks/auth/useLogin';

const Login = () => {

	const [inputs, setInputs] = useState({//inputs state objesi oluşturuluyor ve useState ile yönetiliyor
		username: "",
		password: ""
	});
	const [showPassword, setShowPassword] = useState(false);
	const { loading, login } = useLogin();

	const handleSubmit = async (e) => { // form submit işlemi için handleSubmit fonksiyonu
		e.preventDefault(); // sayfanın yenilenmesini engeller
		await login(inputs); // login işleminin tamamlanmasını bekle
	};

	//görsel kısım
	return (
		<div className='w-full max-w-sm mx-auto animate-rise'>
			<div className='surface-glass rounded-2xl p-7 shadow-2xl'>

				{/* Marka başlığı */}
				<div className='flex flex-col items-center gap-2 mb-6'>
					<div
						className='w-14 h-14 rounded-2xl flex items-center justify-center text-2xl brand-badge'
					>
						💬
					</div>
					<h1 className='text-xl font-semibold' style={{ color: 'var(--text-primary)' }}>
						Tekrar hoş geldin
					</h1>
					<p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
						Sohbete devam etmek için giriş yap
					</p>
				</div>

				<form onSubmit={handleSubmit} className='flex flex-col gap-4'>
					<div className='flex flex-col gap-1.5'>
						<label htmlFor='username' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
							Kullanıcı adı
						</label>
						<input
							id='username'
                            autoCapitalize='none'
                            spellCheck={false}
                            required
							type='text'
							autoComplete='username'
							placeholder='kullaniciadin'
							className='field'
							name='username'
							value={inputs.username}
							onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
						//input alanında değişiklik olduğunda tetiklenir, e objesinin target özelliği input elementini temsil eder
						//setInputs ile mevcut state korunup sadece username alanı güncellenir
						/>
					</div>

					<div className='flex flex-col gap-1.5'>
						<label htmlFor='password' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
							Parola
						</label>
						<div className='relative'>
							<input
								id='password'
                                required
								type={showPassword ? 'text' : 'password'}
								autoComplete='current-password'
								placeholder='••••••••'
								className='field field-action'
								name='password'
								value={inputs.password}
								onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
							/>
							<button
								type='button'
								onClick={() => setShowPassword((v) => !v)}
								className='absolute right-3 top-1/2 -translate-y-1/2 text-sm'
								style={{ color: 'var(--text-muted)' }}
								aria-label={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
							>
								{showPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>

					{/* Login butonu */}
					<button
						type='submit'
						className='btn-primary-grad mt-1 flex items-center justify-center gap-2'
						disabled={loading}
					>
						{loading ? (
							<>
								<span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
								Giriş yapılıyor
							</>
						) : 'Giriş yap'}
					</button>

					<Link to='/signup' className='text-center text-sm mt-1' style={{ color: 'var(--text-secondary)' }}>
						Hesabın yok mu?{' '}
						<span style={{ color: 'var(--accent-hover)' }} className='font-medium hover:underline'>
							Kayıt ol
						</span>
					</Link>
				</form>
			</div>
		</div>
	);
}

export default Login;
