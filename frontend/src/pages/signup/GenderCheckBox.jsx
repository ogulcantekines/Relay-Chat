// Cinsiyet seçimi: iki kutu yerine birbirini dışlayan iki düğme gibi davranır.
// Seçili olan vurgulanır; aynı düğmeye tekrar basmak seçimi kaldırır.
const GenderCheckBox = (props) => {
	const options = [
		{ value: 'male', label: 'Erkek' },
		{ value: 'female', label: 'Kadın' }
	];

	return (
		<div className='flex flex-col gap-1.5'>
			<span className='text-xs font-medium' style={{ color: 'var(--text-secondary)' }}>
				Cinsiyet
			</span>
			<div className='grid grid-cols-2 gap-2'>
				{options.map(({ value, label }) => {
					const selected = props.gender === value;
					return (
						<label
							key={value}
							className='cursor-pointer rounded-xl px-3 py-2.5 text-center text-sm transition-colors'
							style={{
								backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-elevated)',
								border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-subtle)'}`,
								color: selected ? 'var(--accent-hover)' : 'var(--text-secondary)',
								fontWeight: selected ? 600 : 400
							}}
						>
							<input
								type='checkbox'
								className='sr-only'
								value={value}
								checked={selected} // seçili olan gender ile eşleşiyorsa işaretli görünür
								onChange={props.onChange} //değişiklikte SignUp'taki handleCheckboxChange tetiklenir
							/>
							{label}
						</label>
					);
				})}
			</div>
		</div>
	);
};

export default GenderCheckBox;
