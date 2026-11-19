<?php
/**
 * Plugin Name: Plazo
 * Description: Le formulaire de réservation de votre parking, relié à Plazo Pro : places et prix du moment, réservation directement dans votre planning.
 * Version: 1.0.0
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Author: Benford Tech
 * Author URI: https://pro.plazo.fr
 * License: GPLv2 or later
 * Text Domain: plazo
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PLAZO_VERSION', '1.0.0');
define('PLAZO_API_BASE', 'https://www.plazo.fr/api');

/** The API's address: the constant, unless the site sets PLAZO_API_URL in wp-config.php (tests). */
function plazo_api_base()
{
    return defined('PLAZO_API_URL') ? rtrim(PLAZO_API_URL, '/') : PLAZO_API_BASE;
}

/** One call to Plazo with the site's key; returns [status, decoded body]. The key never leaves the server. */
function plazo_request($method, $path, $body = null)
{
    $key = trim((string) get_option('plazo_site_key', ''));
    if ($key === '') {
        return array(0, array('code' => 'no_key'));
    }
    $args = array(
        'method' => $method,
        'timeout' => 15,
        'headers' => array(
            'X-Plazo-Site-Key' => $key,
            'X-Plazo-Site-Url' => home_url('/'),
            'Accept' => 'application/json',
        ),
    );
    if ($body !== null) {
        $args['headers']['Content-Type'] = 'application/json';
        $args['body'] = wp_json_encode($body);
    }
    $response = wp_remote_request(plazo_api_base() . $path, $args);
    if (is_wp_error($response)) {
        return array(0, array('code' => 'network'));
    }
    $decoded = json_decode(wp_remote_retrieve_body($response), true);
    return array((int) wp_remote_retrieve_response_code($response), is_array($decoded) ? $decoded : array());
}

// ---- Réglages › Plazo ---------------------------------------------------------------------------------------------------

add_action('admin_menu', function () {
    add_options_page('Plazo', 'Plazo', 'manage_options', 'plazo', 'plazo_settings_page');
});

add_action('admin_init', function () {
    register_setting('plazo', 'plazo_site_key', array('type' => 'string', 'sanitize_callback' => 'sanitize_text_field'));
    register_setting('plazo', 'plazo_accent', array('type' => 'string', 'sanitize_callback' => 'sanitize_hex_color', 'default' => '#1E5E2E'));
});

function plazo_settings_page()
{
    if (!current_user_can('manage_options')) {
        return;
    }
    $status = null;
    if (trim((string) get_option('plazo_site_key', '')) !== '') {
        list($code, $body) = plazo_request('GET', '/public/site/status');
        $status = $code === 200 ? $body : array('error' => isset($body['code']) ? $body['code'] : 'error');
    }
    ?>
    <div class="wrap">
        <h1>Plazo</h1>
        <p>Collez la clé de votre parking, que vous trouvez dans Plazo Pro, <strong>Parking › Réglages › Site du parking</strong>.</p>
        <?php if (is_array($status) && isset($status['connected'])) : ?>
            <div class="notice notice-success inline"><p>Connecté à <strong><?php echo esc_html($status['parkingName']); ?></strong>.</p></div>
        <?php elseif (is_array($status)) : ?>
            <div class="notice notice-error inline"><p>La clé n'est pas reconnue par Plazo. Vérifiez-la, ou créez-en une nouvelle dans Plazo Pro.</p></div>
        <?php endif; ?>
        <form method="post" action="options.php">
            <?php settings_fields('plazo'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="plazo_site_key">Clé Plazo</label></th>
                    <td><input name="plazo_site_key" id="plazo_site_key" type="password" class="regular-text" autocomplete="off" value="<?php echo esc_attr(get_option('plazo_site_key', '')); ?>"></td>
                </tr>
                <tr>
                    <th scope="row"><label for="plazo_accent">Couleur des boutons</label></th>
                    <td><input name="plazo_accent" id="plazo_accent" type="text" class="small-text" value="<?php echo esc_attr(get_option('plazo_accent', '#1E5E2E')); ?>"> <span class="description">Par exemple #0E4C6E.</span></td>
                </tr>
            </table>
            <?php submit_button('Enregistrer'); ?>
        </form>
        <h2>Afficher le formulaire</h2>
        <p>Collez ce code dans la page de votre choix (bloc « Code court ») :</p>
        <p><code>[plazo_reservation]</code></p>
        <p>Les réservations arrivent tout de suite dans le planning de Plazo Pro, au canal « Site du parking ». Le client paie au parking.</p>
    </div>
    <?php
}

// ---- Le formulaire --------------------------------------------------------------------------------------------------------

add_shortcode('plazo_reservation', function () {
    wp_enqueue_style('plazo', plugins_url('assets/plazo.css', __FILE__), array(), PLAZO_VERSION);
    wp_enqueue_script('plazo', plugins_url('assets/plazo.js', __FILE__), array(), PLAZO_VERSION, true);
    wp_localize_script('plazo', 'plazoSite', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('plazo'),
    ));
    $accent = sanitize_hex_color(get_option('plazo_accent', '#1E5E2E'));
    if (!$accent) {
        $accent = '#1E5E2E';
    }
    ob_start();
    ?>
    <form class="plazo-form" style="--plazo-accent: <?php echo esc_attr($accent); ?>" novalidate>
        <div class="plazo-row">
            <label>Dépôt <input type="date" name="arrivalDate" required></label>
            <label>Heure <input type="time" name="arrivalTime" value="08:00" required></label>
        </div>
        <div class="plazo-row">
            <label>Retour <input type="date" name="returnDate" required></label>
            <label>Heure <input type="time" name="returnTime" value="18:00" required></label>
        </div>
        <p class="plazo-quote" aria-live="polite"></p>
        <div class="plazo-row">
            <label>Prénom <input type="text" name="firstName" autocomplete="given-name" required></label>
            <label>Nom <input type="text" name="lastName" autocomplete="family-name" required></label>
        </div>
        <div class="plazo-row">
            <label>Téléphone mobile <input type="tel" name="phone" autocomplete="tel" required></label>
            <label>E-mail <input type="email" name="email" autocomplete="email"></label>
        </div>
        <div class="plazo-row">
            <label>Plaque <input type="text" name="plate" placeholder="AB-123-CD"></label>
            <label>Vol retour <input type="text" name="returnFlight" placeholder="TO 3627"></label>
        </div>
        <div class="plazo-row">
            <label>Passagers <input type="number" name="passengers" min="1" max="9" value="1"></label>
        </div>
        <label>Message <textarea name="message" rows="2" maxlength="300"></textarea></label>
        <input type="text" name="website" class="plazo-trap" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit" class="plazo-button">Réserver</button>
        <p class="plazo-result" role="status" aria-live="polite"></p>
        <p class="plazo-by">Réservation gérée avec Plazo · paiement au parking</p>
    </form>
    <?php
    return ob_get_clean();
});

/** The JSON answer of an AJAX call; a nonce that fails or the trap field filled ends here. */
function plazo_ajax_guard()
{
    if (!check_ajax_referer('plazo', 'nonce', false)) {
        wp_send_json(array('code' => 'expired'), 403);
    }
    if (!empty($_POST['website'])) {
        wp_send_json(array('code' => 'refused'), 400);
    }
}

function plazo_ajax_quote()
{
    plazo_ajax_guard();
    $query = http_build_query(array(
        'arrivalAt' => sanitize_text_field(wp_unslash(isset($_POST['arrivalAt']) ? $_POST['arrivalAt'] : '')),
        'returnAt' => sanitize_text_field(wp_unslash(isset($_POST['returnAt']) ? $_POST['returnAt'] : '')),
    ));
    list($code, $body) = plazo_request('GET', '/public/site/quote?' . $query);
    wp_send_json($body, $code ? $code : 502);
}
add_action('wp_ajax_plazo_quote', 'plazo_ajax_quote');
add_action('wp_ajax_nopriv_plazo_quote', 'plazo_ajax_quote');

function plazo_ajax_book()
{
    plazo_ajax_guard();
    $fields = array('arrivalAt', 'returnAt', 'firstName', 'lastName', 'phone', 'email', 'plate', 'returnFlight', 'passengers', 'message');
    $booking = array();
    foreach ($fields as $field) {
        $value = isset($_POST[$field]) ? wp_unslash($_POST[$field]) : '';
        $booking[$field] = $field === 'message' ? sanitize_textarea_field($value) : sanitize_text_field($value);
    }
    list($code, $body) = plazo_request('POST', '/public/site/bookings', $booking);
    wp_send_json($body, $code ? $code : 502);
}
add_action('wp_ajax_plazo_book', 'plazo_ajax_book');
add_action('wp_ajax_nopriv_plazo_book', 'plazo_ajax_book');
