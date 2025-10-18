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
        const value = e.target.value;       // 'male' veya 'female'- e nesnesinin target özelliği input elementini temsil eder ve value özelliği inputun o anki değerini verir
        const checked = e.target.checked;   // true veya false - e nesnesinin target özelliği input elementini temsil eder ve checked özelliği checkboxun işaretli olup olmadığını belirtir

        if (checked) {
            setInputs({ ...inputs, gender: value }); //setInputs fonksiyonu ile inputs stateini güncelliyoruz. ...inputs ile mevcut state'i koruyoruz ve sadece gender alanını güncelliyoruz
        } else {
            setInputs({ ...inputs, gender: "" }); // uncheck için 
        }
    };

    const handleSubmit = async (e) => {//form submit olduğunda, e parametre olarak event objesi gelir bu obje değiişiklik olduğunda tetiklenir
        e.preventDefault();//sayfanın yenilenmesini engeller
        console.log(inputs);
        await signUp(inputs); //useSignup hook'undan gelen signUp fonksiyonunu çağırıyoruz ve inputs objesini parametre olarak veriyoruz
    }

    return (
        <div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
            <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-0'>
                <h1 className='text-3xl font-semibold text-center text-gray-300'>
                    Sign Up <span className='text-blue-500'> ChatApp</span>
                </h1>

                <form onSubmit={handleSubmit}> {/*form submit olduğunda handleSubmit fonksiyonu tetiklenir*/}
                    <div>
                        <label className='label p-2'>
                            <span className='text-base label-text'>Full Name</span>
                        </label>
                        <input
                            type='text'
                            placeholder='Enter Full Name'
                            className='w-full input input-bordered  h-10'
                            value={inputs.fullName}/*inputs statein deki fullName alanı*/
                            onChange={(e) => setInputs({ ...inputs, fullName: e.target.value })}
                        //input alanında değişiklik olduğunda tetiklenir, e parametresi event objesini temsil eder. e objesinin target özelliği input elementini temsil eder ve value özelliği inputun o anki değerini verir
                        //setInputs fonksiyonu ile inputs stateini güncelliyoruz. ...inputs ile mevcut state'i koruyoruz ve sadece fullName alanını güncelliyoruz
                        />
                    </div>

                    <div>
                        <label className='label p-2 '>
                            <span className='text-base label-text'>Username</span>
                        </label>
                        <input
                            type='text'
                            placeholder='Enter Username'
                            className='w-full input input-bordered h-10'
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
                            type='Password'
                            placeholder='Enter Password'
                            className='w-full input input-bordered h-10'
                            value={inputs.password} //inputs statein deki password alanı
                            onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                        //input alanında değişiklik olduğunda tetiklenir, e parametresi event objesini temsil eder. e objesinin target özelliği input elementini temsil eder ve value özelliği inputun o anki değerini verir
                        //setInputs fonksiyonu ile inputs stateini güncelliyoruz. ...inputs ile mevcut state'i koruyoruz ve sadece password alanını güncelliyoruz
                        />
                    </div>

                    <div>
                        <label className='label'>
                            <span className='text-base label-text'>Confirm Password</span>
                        </label>
                        <input
                            type='password'
                            placeholder='Confirm Password'
                            className='w-full input input-bordered h-10 mb-2'
                            value={inputs.confirmPassword} //inputs statein deki confirmPassword alanı
                            onChange={(e) => setInputs({ ...inputs, confirmPassword: e.target.value })}
                        //input alanında değişiklik olduğunda tetiklenir, e parametresi event objesini temsil eder. e objesinin target özelliği input elementini temsil eder ve value özelliği inputun o anki değerini verir
                        //setInputs fonksiyonu ile inputs stateini güncelliyoruz. ...inputs ile mevcut state'i koruyoruz ve sadece confirmPassword alanını güncelliyoruz
                        />
                    </div>

                    {/* Gender Checkbox componentini ekliyoruz. Gender ve onChange props özelliklerini geçiriyoruz
                    mesela props olarak gender ve onchange var gibi düşün. yani props nesne olsun gender ve onChange onun özellikleri
                    gibi düşün. bu component burada propsunun özelliklerini eşitlemek istediğimiz değerlere eşitlenerek
                    çağrılıyor.Arka planda olan işlemler ise ana component dosyasında props nesnesi parametre olarak yer alır
                    ve gender ve onChange nesne özelliklerine props.gender ve props.onChange ile erişilir. props.gender değeri
                    burada çağırılırken eşitlediğimiz input.gender değeri olurken onChange ise handleCheckboxChange fonksiyonu olur
                    */}
                    <GenderCheckBox
                        gender={inputs.gender}
                        onChange={handleCheckboxChange}
                    />

                    {/* Link to ile login sayfasına yönlendirme yapıyoruz App.jsx te Router ile olan yönlendirmeleri kurmuştuk. Burada sadece Link kullanıyoruz */}
                    <Link to='/login'>
                        <p className='text-sm  hover:underline hover:text-blue-600 mt-2 inline-block'>
                            Already have an account? Login
                        </p>
                    </Link>

                    <div>
                        {/* Sign Up butonuna tıklandığında handleSubmit fonksiyonu tetiklenir */}
                        <button
                            className='btn btn-block btn-sm mt-2 border border-slate-700'
                            disabled={loading} //loading true ise buton disable olur. loading useSignup hook'undan geliyor
                        >
                            {loading ? <span className="loading loading-spinner"></span> : "Sign Up"} {/*loading true ise yükleniyor spinnerı göster, değilse Sign Up yazısını göster*/}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
export default SignUp;