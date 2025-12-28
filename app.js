// Basic UI Logic & Supabase Integration Stub
// Supabase Configuration
const SUPABASE_URL = 'https://ltsmuisdrqydfydptlrv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_a56rum3phSKbor1PPF8Psw_GQmkTsMk';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login state global
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Tukang Gunting script loaded.');

    // Real Barber Data Fetching from Supabase
    const fetchBarbers = async () => {
        const barbersList = document.getElementById('barbersList');
        if (!barbersList) return;

        try {
            // Join barbers with profiles to get information
            const { data, error } = await _supabase
                .from('barbers')
                .select(`
                    id,
                    bio,
                    location,
                    rating,
                    profiles (
                        full_name,
                        avatar_url
                    )
                `);

            if (error) throw error;

            if (data.length === 0) {
                barbersList.innerHTML = '<p class="section-subtitle">Tiada barber ditemui. Sila tambah data di Supabase.</p>';
                return;
            }

            barbersList.innerHTML = data.map(barber => `
                <div class="barber-card">
                    <img src="${barber.profiles.avatar_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}" alt="${barber.profiles.full_name}" class="barber-image">
                    <div class="barber-info">
                        <h3 class="barber-name">${barber.profiles.full_name}</h3>
                        <div class="barber-location">
                            <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i>
                            ${barber.location}
                        </div>
                        <div class="barber-rating">
                            <i data-lucide="star" style="width: 16px; height: 16px; fill: var(--primary);"></i>
                            ${barber.rating || '0.0'}
                        </div>
                    </div>
                </div>
            `).join('');

            lucide.createIcons();
        } catch (error) {
            console.error('Error fetching barbers:', error);
            barbersList.innerHTML = '<p class="section-subtitle">Ralat memuatkan data. Sila pastikan Table sudah dicipta di Supabase.</p>';
        }
    };

    // Load actual data
    fetchBarbers();

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Auth Modal Logic
    const authModal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const closeModal = document.querySelector('.close-modal');
    const toggleAuth = document.getElementById('toggleAuth');
    const authForm = document.getElementById('authForm');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authTitle = document.querySelector('#authFormTitle h2');
    const authSubtitle = document.querySelector('#authFormTitle p');
    const authSwitchText = document.getElementById('authSwitchText');

    let isLogin = true;

    const toggleAuthMode = () => {
        isLogin = !isLogin;
        authTitle.innerText = isLogin ? 'Log Masuk' : 'Daftar Akaun';
        authSubtitle.innerText = isLogin ? 'Selamat kembali ke Tukang Gunting' : 'Sertai komuniti Tukang Gunting hari ini';
        authSubmitBtn.innerText = isLogin ? 'Log Masuk' : 'Daftar';
        authSwitchText.innerHTML = isLogin ?
            'Belum ada akaun? <a href="#" id="toggleAuth">Daftar Sekarang</a>' :
            'Sudah ada akaun? <a href="#" id="toggleAuth">Log Masuk</a>';

        const roleGroup = document.getElementById('roleGroup');
        if (roleGroup) {
            roleGroup.style.display = isLogin ? 'none' : 'block';
        }

        // Re-attach listener because innerHTML wipes it
        document.getElementById('toggleAuth').addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    };

    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            authModal.style.display = 'flex';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            authModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    if (toggleAuth) {
        toggleAuth.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthMode();
        });
    }

    // Auth State Observer
    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUIForLoggedInUser();
            fetchBarbers(); // Refresh view
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
    });

    const updateUIForLoggedInUser = async () => {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerText = 'Dashboard';
            loginBtn.onclick = () => {
                window.location.hash = '#dashboard';
                showDashboard();
            };
        }

        // Add logout link to nav if not exists
        if (!document.getElementById('logoutBtn')) {
            const nav = document.querySelector('.nav-links');
            const logoutBtn = document.createElement('a');
            logoutBtn.id = 'logoutBtn';
            logoutBtn.href = '#';
            logoutBtn.innerText = 'Log Keluar';
            logoutBtn.style.color = '#ff4444';
            logoutBtn.onclick = async (e) => {
                e.preventDefault();
                await _supabase.auth.signOut();
                location.reload();
            };
            nav.insertBefore(logoutBtn, loginBtn);
        }
    };

    const updateUIForLoggedOutUser = () => {
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.innerText = 'Log Masuk';
            loginBtn.onclick = () => authModal.style.display = 'flex';
        }
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.remove();
    };

    const showDashboard = async () => {
        if (!currentUser) return;

        // Fetch profile to check role
        const { data: profile, error: profileErr } = await _supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', currentUser.id)
            .single();

        if (profileErr) {
            console.error('Error fetching profile:', profileErr);
            return;
        }

        // Toggle visibility
        document.querySelector('main').style.display = 'none';

        if (profile.role === 'barber') {
            document.getElementById('dashboardSection').style.display = 'none';
            document.getElementById('barberDashboardSection').style.display = 'block';
            renderBarberDashboard(profile);
        } else {
            document.getElementById('barberDashboardSection').style.display = 'none';
            document.getElementById('dashboardSection').style.display = 'block';
            renderUserDashboard(profile);
        }
    };

    const renderUserDashboard = async (profile) => {
        const bookingList = document.getElementById('userBookingsList');
        bookingList.innerHTML = '<p>Memuatkan tempahan anda...</p>';

        const { data, error } = await _supabase
            .from('bookings')
            .select(`
                id,
                scheduled_at,
                status,
                services (name, price),
                barbers (profiles (full_name))
            `)
            .eq('customer_id', currentUser.id);

        if (error) {
            bookingList.innerHTML = '<p>Ralat memuatkan tempahan.</p>';
            return;
        }

        if (data.length === 0) {
            bookingList.innerHTML = '<p>Anda belum mempunyai sebarang tempahan.</p>';
            return;
        }

        bookingList.innerHTML = data.map(booking => `
            <div class="booking-card">
                <div class="booking-details">
                    <h4>${booking.services.name}</h4>
                    <p>Barber: ${booking.barbers.profiles.full_name}</p>
                    <p>Tarikh/Masa: ${new Date(booking.scheduled_at).toLocaleString()}</p>
                </div>
                <div class="booking-status ${booking.status}">
                    ${booking.status.toUpperCase()}
                </div>
            </div>
        `).join('');
    };

    const renderBarberDashboard = async (profile) => {
        const bookingList = document.getElementById('barberBookingsList');
        bookingList.innerHTML = '<p>Memuatkan tempahan pelanggan...</p>';

        // First, check if this user is in the barbers table
        const { data: barber, error: barberErr } = await _supabase
            .from('barbers')
            .select('id')
            .eq('id', currentUser.id)
            .single();

        if (barberErr) {
            // If not in barbers table yet, show profile completion form
            bookingList.innerHTML = `
                <div class="setup-notice">
                    <p>Anda belum mendaftar maklumat profesional anda.</p>
                    <button class="btn btn-primary" id="setupBarberProfileBtn">Lengkapkan Profil Barber</button>
                </div>
            `;
            document.getElementById('setupBarberProfileBtn').onclick = () => {
                alert('Fungsi ini sedang dibangunkan. Buat masa ini, sila hubungi Admin untuk pengesahan barber.');
            };
            return;
        }

        const { data, error } = await _supabase
            .from('bookings')
            .select(`
                id,
                scheduled_at,
                status,
                services (name),
                profiles:customer_id (full_name)
            `)
            .eq('barber_id', currentUser.id);

        if (error) {
            bookingList.innerHTML = '<p>Ralat memuatkan tempahan: ' + error.message + '</p>';
            return;
        }

        if (data.length === 0) {
            bookingList.innerHTML = '<p>Tiada tempahan baharu untuk anda.</p>';
            return;
        }

        bookingList.innerHTML = data.map(booking => `
            <div class="booking-card">
                <div class="booking-details">
                    <h4>Pelanggan: ${booking.profiles.full_name}</h4>
                    <p>Perkhidmatan: ${booking.services.name}</p>
                    <p>Tarikh/Masa: ${new Date(booking.scheduled_at).toLocaleString()}</p>
                </div>
                <div class="booking-status ${booking.status}">
                    ${booking.status.toUpperCase()}
                </div>
            </div>
        `).join('');
    };

    // Global navigation for dashboard breadcrumb
    window.addEventListener('hashchange', () => {
        if (!window.location.hash.includes('dashboard')) {
            document.querySelector('main').style.display = 'block';
            document.getElementById('dashboardSection').style.display = 'none';
            document.getElementById('barberDashboardSection').style.display = 'none';
        }
    });

    // Supabase Auth Handling
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            authSubmitBtn.disabled = true;
            authSubmitBtn.innerText = 'Sila tunggu...';

            try {
                if (isLogin) {
                    const { data, error } = await _supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    if (error) throw error;
                    alert('Selamat datang!');
                } else {
                    const role = document.querySelector('input[name="role"]:checked')?.value || 'customer';
                    const { data, error } = await _supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                full_name: email.split('@')[0],
                                role: role
                            }
                        }
                    });
                    if (error) throw error;
                    alert('Sifa semak e-mel anda untuk pengesahan!');
                }
                authModal.style.display = 'none';
            } catch (error) {
                alert('Ralat: ' + error.message);
            } finally {
                authSubmitBtn.disabled = false;
                authSubmitBtn.innerText = isLogin ? 'Log Masuk' : 'Daftar';
            }
        });
    }

    // Booking Logic
    const bookingModal = document.getElementById('bookingModal');
    const closeBookingModal = document.getElementById('closeBookingModal');
    const dateScroll = document.getElementById('dateScroll');
    const timeGrid = document.getElementById('timeGrid');
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');

    let selectedDate = null;
    let selectedTime = null;
    let currentService = null;

    const generateDates = () => {
        const dates = [];
        const days = ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
        const today = new Date();

        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            dates.push({
                full: date,
                dayName: days[date.getDay()],
                dayNum: date.getDate()
            });
        }

        dateScroll.innerHTML = dates.map((d, i) => `
            <div class="date-item ${i === 0 ? 'active' : ''}" data-date="${d.full.toISOString()}">
                <span>${d.dayName}</span>
                <span>${d.dayNum}</span>
            </div>
        `).join('');

        selectedDate = dates[0].full.toISOString();

        // Add listeners
        document.querySelectorAll('.date-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.date-item').forEach(d => d.classList.remove('active'));
                item.classList.add('active');
                selectedDate = item.dataset.date;
                renderTimeSlots();
            });
        });
    };

    const renderTimeSlots = () => {
        const slots = [
            '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM',
            '03:00 PM', '04:00 PM', '05:00 PM', '08:00 PM', '09:00 PM'
        ];

        timeGrid.innerHTML = slots.map(slot => `
            <div class="time-slot" data-time="${slot}">${slot}</div>
        `).join('');

        // Add listeners
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                selectedTime = slot.dataset.time;
            });
        });
    };

    const openBooking = (serviceName, price) => {
        currentService = { name: serviceName, price: price };
        document.getElementById('modalServiceName').innerText = serviceName;
        document.getElementById('modalTotalPrice').innerText = price;
        generateDates();
        renderTimeSlots();
        bookingModal.style.display = 'flex';
    };

    if (closeBookingModal) {
        closeBookingModal.addEventListener('click', () => {
            bookingModal.style.display = 'none';
        });
    }

    // Attach to "Tempah" buttons
    document.querySelectorAll('.btn-sm').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceItem = btn.closest('.service-item');
            const name = serviceItem.querySelector('h3').innerText;
            const price = serviceItem.querySelector('.service-price').innerText;
            openBooking(name, price);
        });
    });

    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', async () => {
            if (!selectedTime) {
                alert('Sila pilih masa!');
                return;
            }

            // Check if user is logged in
            const { data: { user } } = await _supabase.auth.getUser();

            if (!user) {
                alert('Sila log masuk untuk membuat tempahan.');
                authModal.style.display = 'flex';
                return;
            }

            confirmBookingBtn.disabled = true;
            confirmBookingBtn.innerText = 'Menempah...';

            try {
                // Untuk demo, kita perlukan ID Barber dan Service yang sah dari DB
                // Anda perlu pastikan id ini wujud dalam table anda
                const { data: barberData } = await _supabase.from('barbers').select('id').limit(1).single();
                const { data: serviceData } = await _supabase.from('services').select('id').limit(1).single();

                if (!barberData || !serviceData) {
                    throw new Error('Sila hubungi Admin. Data Barber atau Perkhidmatan tidak ditemui dalam database.');
                }

                const { error } = await _supabase.from('bookings').insert({
                    customer_id: user.id,
                    barber_id: barberData.id,
                    service_id: serviceData.id,
                    scheduled_at: new Date(selectedDate).toISOString().split('T')[0] + ' ' + selectedTime,
                    status: 'pending'
                });

                if (error) throw error;
                alert('Tempahan berjaya!');
                bookingModal.style.display = 'none';
            } catch (error) {
                alert('Ralat semasa tempahan: ' + error.message);
            } finally {
                confirmBookingBtn.disabled = false;
                confirmBookingBtn.innerText = 'Sahkan Tempahan';
            }
        });
    }

    // Scroll effect for header
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
            header.style.padding = '0.75rem 0';
        } else {
            header.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            header.style.padding = '1rem 0';
        }
    });
});
