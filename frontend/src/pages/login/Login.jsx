import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useLogin from '../../hooks/auth/useLogin';

const Login = () => {

	const [inputs, setInputs] = useState({//inputs state objesi oluşturuluyor ve useState ile yönetiliyor
		username: "",
		password: ""
	});
	const { loading, login } = useLogin();

	const handleSubmit = async (e) => { // form submit işlemi için handleSubmit fonksiyonu
		e.preventDefault(); // sayfanın yenilenmesini engeller
		await login(inputs); // login işleminin tamamlanmasını bekle
	};

	//görsel kısım
	return (
		<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
			<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-0'>
				<h1 className='text-3xl font-semibold text-center text-gray-300'>
					Login<span className='text-blue-500'> ChatApp</span>
				</h1>

				<form onSubmit={handleSubmit}>
					<div>
						<label className='label p-2'>
							<span className='text-base label-text'>Username</span>
						</label>
						<input
							type='text'
							placeholder='Enter username'
							className='w-full input input-bordered h-10'
							name='username'
							value={inputs.username}
							onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
						//input alanında değişiklik olduğunda tetiklenir, e parametresi event objesini temsil eder. e objesinin target özelliği input elementini temsil eder ve value özelliği inputun o anki değerini verir
						//setInputs fonksiyonu ile inputs stateini güncelliyoruz. ...inputs ile mevcut state'i koruyoruz ve sadece username alanını güncelliyoruz
						/>
					</div>

					<div>
						<label className='label'>
							<span className='text-base label-text'>Password</span>
						</label>
						<input
							type='password'
							placeholder='Enter Password'
							className='w-full input input-bordered h-10'
							name='password'
							value={inputs.password}
							onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
						//input alanında değişiklik olduğunda tetiklenir, e parametresi event objesini temsil eder. e objesinin target özelliği input elementini temsil eder ve value özelliği inputun o anki değerini verir
						//setInputs fonksiyonu ile inputs stateini güncelliyoruz. ...inputs ile mevcut state'i koruyoruz ve sadece password alanını güncelliyoruz
						/>
					</div>

					<Link to='/signup'> {/* app.jsx te tanımlı link kısmı orada /signup a link to gelince ne yapılacağı yazıyor */}
						<p className='mt-4 text-sm text-left text-gray-200 hover:underline mb-3'>
							Don't have an account? Sign Up
						</p>
					</Link>

					{/* Login butonu */}
					<div>
						<button
							type="submit"
							className='btn btn-block btn-sm mt-2 border border-slate-700'
							disabled={loading}
						>
							{loading ? <span className="loading loading-spinner"></span> : "Login"}
							{/* eğer loading true ise yükleniyor spinnerı göster, değilse Login yazısını göster */}
						</button>
					</div>

				</form>
			</div>
		</div>
	);
}

export default Login;
