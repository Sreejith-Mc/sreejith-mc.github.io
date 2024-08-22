const navHamburger = document.getElementById('nav-hamburger');
navHamburger.addEventListener('click', () => {
    const navDropdownList = document.querySelector('.nav-dropdown-list');
    var dropdownDisplay = getComputedStyle(navDropdownList).display;
    if (dropdownDisplay === 'none') {
        navDropdownList.style.display = 'block';
    } else if (dropdownDisplay === 'block') {
        navDropdownList.style.display = 'none';
    }
});