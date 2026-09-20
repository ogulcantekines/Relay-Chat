import Dialog from './Dialog';
import { passwordIsValid } from '../../utils/password';
import Avatar from '../Avatar';
import { useState } from "react";
import { IoClose, IoCopyOutline, IoCheckmark } from "react-icons/io5";
import useAuth from "../../zustand/useAuth";
import useUpdateProfile from "../../hooks/auth/useUpdateProfile";
import useChangePassword from "../../hooks/auth/useChangePassword";

// Hesap ayarları penceresi.
// İki sekme: profil bilgileri ve şifre değiştirme.
// Kullanıcı adı burada değiştirilemez; arkadaşlıklar ve sohbetler ona bağlı
// olduğu için sabit kalıyor, bu yüzden salt okunur gösteriliyor.
const SettingsModal = ({ onClose }) => {
    const authUser = useAuth((state) => state.authUser);
    const { updateProfile, loading: savingProfile } = useUpdateProfile();
    const { changePassword, loading: savingPassword } = useChangePassword();

    const [tab, setTab] = useState("profile");
    const [copied, setCopied] = useState(false);

    const [fullName, setFullName] = useState(authUser?.fullName || "");
    const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const nameValid = fullName.trim().length > 0 && fullName.trim().length <= 50;
    const picValid = profilePic === '' || (/^https:\/\/\S+$/i.test(profilePic) && profilePic.length <= 2048);
    const profileChanged = fullName !== authUser?.fullName || profilePic !== authUser?.profilePic;

    const passwordsMatch = confirmPassword === "" || newPassword === confirmPassword;
    const passwordValid = passwordIsValid(newPassword);
    const canChangePassword =
        currentPassword.length > 0 && passwordValid && newPassword === confirmPassword;

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!nameValid || !picValid || !profileChanged) return;
        await updateProfile({ fullName: fullName.trim(), profilePic });
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!canChangePassword) return;
        const ok = await changePassword(currentPassword, newPassword);
        if (ok) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    };

    const copyFriendCode = async () => {
        try {
            await navigator.clipboard.writeText(authUser.friendCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // Pano izni yoksa sessizce geç; kod ekranda zaten görünüyor
        }
    };

    return (
        <Dialog onClose={onClose} labelledBy="settings-title">
                {/* Başlık */}
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                    <h2 id="settings-title" className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                        Hesap ayarları
                    </h2>
                    <button onClick={onClose} className="w-9 h-9 icon-btn" title="Kapat">
                        <IoClose />
                    </button>
                </div>

                {/* Sekmeler */}
                <div className="flex gap-1 px-5 pt-3">
                    {[
                        ["profile", "Profil"],
                        ["password", "Şifre"]
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{
                                background: tab === key ? "var(--accent-soft)" : "transparent",
                                color: tab === key ? "var(--accent-hover)" : "var(--text-secondary)"
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === "profile" ? (
                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 p-5">
                        {/* Önizleme */}
                        <div className="flex items-center gap-3">
                            <Avatar
                                name={fullName} src={profilePic || authUser?.profilePic}
                                alt=""
                                className="w-14 h-14 avatar-ring"
                            />
                            <div className="min-w-0">
                                <div className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>
                                    {fullName || "İsimsiz"}
                                </div>
                                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    @{authUser?.username}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="set-fullname" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Görünen ad
                            </label>
                            <input
                                id="set-fullname"
                                type="text"
                                className="field"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                maxLength={50}
                            />
                            {!nameValid && (
                                <span className="text-xs" style={{ color: "var(--danger)" }}>
                                    Ad 1-50 karakter olmalı
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="set-pic" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Avatar adresi
                            </label>
                            <input
                                id="set-pic"
                                maxLength={2048}
                                type="url"
                                className="field"
                                placeholder="https://..."
                                value={profilePic}
                                onChange={(e) => setProfilePic(e.target.value)}
                            />
                            {!picValid && (
                                <span className="text-xs" style={{ color: "var(--danger)" }}>
                                    HTTPS adresi kullan (en fazla 2048 karakter)
                                </span>
                            )}
                        </div>

                        {/* Kullanıcı adı: salt okunur, neden değiştirilemediği belirtiliyor */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Kullanıcı adı
                            </label>
                            <div
                                className="field flex items-center justify-between"
                                style={{ color: "var(--text-muted)", cursor: "not-allowed" }}
                            >
                                <span>@{authUser?.username}</span>
                                <span className="text-[11px]">değiştirilemez</span>
                            </div>
                        </div>

                        {/* Arkadaş kodu */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Arkadaş kodun
                            </label>
                            <button
                                type="button"
                                onClick={copyFriendCode}
                                className="field flex items-center justify-between"
                                title="Panoya kopyala"
                            >
                                <span className="tracking-[0.25em] font-semibold" style={{ color: "var(--accent-hover)" }}>
                                    {authUser?.friendCode}
                                </span>
                                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                    {copied ? <><IoCheckmark /> kopyalandı</> : <><IoCopyOutline /> kopyala</>}
                                </span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary-grad mt-1"
                            disabled={savingProfile || !nameValid || !picValid || !profileChanged}
                        >
                            {savingProfile ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleChangePassword} className="flex flex-col gap-4 p-5">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="set-current" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Mevcut şifre
                            </label>
                            <input
                                id="set-current"
                                type="password"
                                autoComplete="current-password"
                                className="field"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="set-new" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Yeni şifre
                            </label>
                            <input
                                id="set-new"
                                type="password"
                                autoComplete="new-password"
                                className="field"
                                placeholder="En az 8 karakter"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            {newPassword !== "" && !passwordValid && (
                                <span className="text-xs" style={{ color: "var(--danger)" }}>
                                    Şifre en az 8 karakter ve en fazla 72 UTF-8 bayt olmalı
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="set-confirm" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                                Yeni şifre tekrar
                            </label>
                            <input
                                id="set-confirm"
                                type="password"
                                autoComplete="new-password"
                                className="field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {!passwordsMatch && (
                                <span className="text-xs" style={{ color: "var(--danger)" }}>
                                    Şifreler eşleşmiyor
                                </span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="btn-primary-grad mt-1"
                            disabled={savingPassword || !canChangePassword}
                        >
                            {savingPassword ? "Değiştiriliyor..." : "Şifreyi değiştir"}
                        </button>
                    </form>
                )}
        </Dialog>
    );
};

export default SettingsModal;
