import GenderCheckBox from "./GenderCheckBox";
import { Link } from "react-router-dom";
import { useState } from "react";
import useSignup from "../../hooks/auth/useSignup";

const SignUp = () => {

    //use State in dizi kullanımı çoklu use state gibi düşün
    //ama değişikliklerde değişmeyenleri korumak için spread operatörünü kullanıyoruz
    const [inputs, setInputs] = useState({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        gender: ""
    });

    const { signUp, loading } = useSignup(); //useSignup hook'unu kullan

    const handleCheckboxChange = (e) => {
        const value = e.target.value;       // 'male' veya 'female'
        const checked = e.target.checked;   // true veya false

        if (checked) {
            setInputs({ ...inputs, gender: value }); //sadece gender alanını güncelle
        } else {
            setInputs({ ...inputs, gender: "" }); // uncheck için
        }
    };

    const handleSubmit = async (e) => {//form submit olduğunda, e parametre olarak event objesi gelir
        e.preventDefault();//sayfanın yenilenmesini engeller
        await signUp(inputs); //useSignup hook'undan gelen signUp fonksiyonunu çağır
    }

    // Kullanıcı adı kuralı backend ile aynı: 3-20 karakter, harf/rakam/alt çizgi
    const usernameValid = inputs.username === "" || /^[a-zA-Z0-9_]{3,20}$/.test(inputs.username);
    const passwordValid = inputs.password === "" || inputs.password.length >= 6;
    const passwordsMatch = inputs.confirmPassword === "" || inputs.password === inputs.confirmPassword;

    return (
        <div className='w-full max-w-sm mx-auto animate-rise'>
            <div className='surface-glass rounded-2xl p-7 shadow-2xl'>

                <div className='flex flex-col items-center gap-2 mb-6'>
                    <div
                        className='w-14 h-14 rounded-2xl flex items-center justify-center text-2xl brand-badge'
                    >
                        💬
                    </div>
                    <h1 className='text-xl font-semibold' style={{ color: 'var(--text-primary)' }}>
                        Hesap oluştur
                    </h1>
                    <p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                        Birkaç saniyede sohbete başla
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-col gap-3.5'>
                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='fullName' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
                            Ad soyad
                        </label>
                        <input
                            id='fullName'
                            type='text'
                            autoComplete='name'
                            placeholder='Ahmet Yılmaz'
                            className='field'
                            value={inputs.fullName}
                            onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
                        />
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='username' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
                            Kullanıcı adı
                        </label>
                        <input
                            id='username'
                            type='text'
                            autoComplete='username'
                            placeholder='kullaniciadin'
                            className='field'
                            value={inputs.username}
                            onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
                        />
                        {!usernameValid && (
                            <span className='text-xs' style={{ color: 'var(--danger)' }}>
                                3-20 karakter; yalnızca harf, rakam ve alt çizgi
                            </span>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='password' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
                            Parola
                        </label>
                        <input
                            id='password'
                            type='password'
                            autoComplete='new-password'
                            placeholder='En az 6 karakter'
                            className='field'
                            value={inputs.password}
                            onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                        />
                        {!passwordValid && (
                            <span className='text-xs' style={{ color: 'var(--danger)' }}>
                                Parola en az 6 karakter olmalı
                            </span>
                        )}
                    </div>

                    <div className='flex flex-col gap-1.5'>
                        <label htmlFor='confirmPassword' className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
                            Parola tekrar
                        </label>
                        <input
                            id='confirmPassword'
                            type='password'
                            autoComplete='new-password'
                            placeholder='Parolayı tekrar gir'
                            className='field'
                            value={inputs.confirmPassword}
                            onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
                        />
                        {!passwordsMatch && (
                            <span className='text-xs' style={{ color: 'var(--danger)' }}>
                                Parolalar eşleşmiyor
                            </span>
                        )}
                    </div>

                    <GenderCheckBox onChange={handleCheckboxChange} gender={inputs.gender} />

                    <button
                        type='submit'
                        className='btn-primary-grad mt-1 flex items-center justify-center gap-2'
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                                Oluşturuluyor
                            </>
                        ) : 'Kayıt ol'}
                    </button>

                    <Link to='/login' className='text-center text-sm' style={{ color: 'var(--text-secondary)' }}>
                        Zaten hesabın var mı?{' '}
                        <span style={{ color: 'var(--accent-hover)' }} className='font-medium hover:underline'>
                            Giriş yap
                        </span>
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default SignUp;
