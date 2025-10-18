import React from 'react'

const GenderCheckBox = (props) => {
  return (
		<div className='flex'>
			<div className='form-control'>
				<label className={`label gap-2 cursor-pointer`}>
					<span className='label-text'>Male</span>
					<input
						type='checkbox'
						className='checkbox border-slate-900'
						value='male'
						checked={props.gender === 'male'} // en son gelen genderin değeri inputsun gender alanına eşitti bakıyoruz eğer male ise checkbox işaretli olur değilse işaretli olmaz
						onChange={props.onChange} //props ile gelen onChange fonksiyonu. eğer checkboxlarda değişiklik olursa sigNuptaki handleCheckboxChange fonksiyonu tetiklenir.ve o çalışır
					/>
				</label>
			</div>
			<div className='form-control'>
				<label className={`label gap-2 cursor-pointer`}>
					<span className='label-text'>Female</span>
					<input
						type='checkbox'
						className='checkbox border-slate-900'
						value='female'
						checked={props.gender === 'female'} // en son gelen genderin değeri inputsun gender alanına eşitti, şimdi bakıyoruz eğer female ise checkbox işaretli olur değilse işaretli olmaz
						onChange={props.onChange} //props ile gelen onChange fonksiyonu. eğer checkboxlarda değişiklik olursa sigNuptaki handleCheckboxChange fonksiyonu tetiklenir.ve o çalışır
					/>
				</label>
			</div>
		</div>
	);
}

export default GenderCheckBox