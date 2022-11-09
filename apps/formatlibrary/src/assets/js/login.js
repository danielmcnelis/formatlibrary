$(function () {
	$('#showPassword').on('click', function () {
		let from = $('#password').attr('type')
		let to = from === 'password' ? 'text' : 'password'
		$('#password').attr('type', to)
		from = $('#newpassword').attr('type')
		to = from === 'password' ? 'text' : 'password'
		$('#newpassword').attr('type', to)
		from = $('#confirmpassword').attr('type')
		to = from === 'password' ? 'text' : 'password'
		$('#confirmpassword').attr('type', to)
	})

})
