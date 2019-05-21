<?php

class Brizy_Admin_Migrations_GlobalsToDataMigration implements Brizy_Admin_Migrations_MigrationInterface {

	/**
	 * Return the version
	 *
	 * @return mixed
	 */
	public function getVersion() {
		return '1.0.76';
	}

	/**
	 * @return mixed|void
	 * @throws Exception
	 */
	public function execute() {

		try {
			$projectPost = Brizy_Editor_Project::getPost();

			if ( ! $projectPost ) {
				return;
			}

			$storage = Brizy_Editor_Storage_Project::instance( $projectPost->ID );

			if ( $globals = $storage->get( 'globals' ) ) {
				update_post_meta( $projectPost->ID, 'brizy-bk-' . get_class( $this ) . '-' . $this->getVersion(), $storage->get_storage() );

				$beforeMergeGlobals = json_decode( base64_decode( $globals ) );
				$editorBuildPath    = BRIZY_PLUGIN_PATH .
				                      DIRECTORY_SEPARATOR . "public" .
				                      DIRECTORY_SEPARATOR . "editor-build";
				$mergedGlobals      = Migration_Globals_Project::execute( $beforeMergeGlobals, $editorBuildPath );
				$storage->set( 'data', base64_encode( json_encode( $mergedGlobals ) ) );
				$storage->delete( 'globals' );
			}

		} catch ( Exception $e ) {
			return;
		}
	}

	public function getPriority() {
		return 10;
	}
}

class Migration_Globals_Project {
	static function execute( $gb, $buildPath ) {
		$defaults = self::getDefaults( $buildPath );
		$styles   = self::getStyles( $buildPath );
		$fonts    = self::getFonts( $buildPath );

		return self::merge( $gb, $defaults, $styles, $fonts );
	}

	static private function getStyles( $buildPath ) {
		$templates = json_decode( file_get_contents( $buildPath .
		                                             DIRECTORY_SEPARATOR . "templates" .
		                                             DIRECTORY_SEPARATOR . "meta.json" ) );
		$result    = array();

		foreach ( $templates->templates as $template ) {
			foreach ( $template->styles as $style ) {
				$result[] = $style;
			}
		}

		return $result;
	}

	static private function getFonts( $buildPath ) {
		$fonts  = json_decode( file_get_contents( $buildPath .
		                                          DIRECTORY_SEPARATOR . "googleFonts.json" ) );
		$result = array();

		foreach ( $fonts->items as $font ) {
			$result[] = $font;
		}

		return $result;
	}

	static private function getStyle( $styles, $id ) {
		foreach ( $styles as $style ) {
			if ( $style && $style->id === $id ) {
				return $style;
			}
		}
	}

	static private function getDefaults( $buildPath ) {
		return json_decode( file_get_contents( $buildPath .
		                                       DIRECTORY_SEPARATOR . "defaults.json" ) );
	}

	static private function merge( $globals, $default, $styles, $fonts ) {
		$result = $default;

		// extraFont
		if ( isset( $globals->extraFonts ) ) {
			$extraFonts = $globals->extraFonts;
			$finalFonts = array();

			foreach ( $extraFonts as $fontKey ) {
				foreach ( $fonts as $font ) {
					$fontFamilyToKey = preg_replace( '/\s+/', '_', strtolower( $font->family ) );

					if ( $fontKey === $fontFamilyToKey ) {
						$font->brizyId = unique_id();
						$finalFonts[]  = $font;
					}
				}
			}

			$result->fonts->google->data = $finalFonts;

			unset( $globals->extraFonts );
		}

		// selectedStyle
		if ( isset( $globals->styles ) && isset( $globals->styles->_selected ) ) {
			$result->selectedStyle = $globals->styles->_selected;

			unset( $globals->styles->_selected );
		}

		// extraFontStyles
		if ( isset( $globals->styles ) && isset( $globals->styles->_extraFontStyles ) ) {
			$result->extraFontStyles = $globals->styles->_extraFontStyles;

			unset( $globals->styles->_extraFontStyles );
		}

		// styles
		// styles -> copy default
		if ( isset( $globals->styles ) && isset( $globals->styles->default ) ) {
			$result->styles[0]->colorPalette = $globals->styles->default->colorPalette;
			$result->styles[0]->fontStyles   = $globals->styles->default->fontStyles;

			unset( $globals->styles->default );
		}

		// styles -> copy others
		if ( isset ( $globals->styles ) ) {
			foreach ( $globals->styles as $id => $data ) {
				$style = self::getStyle( $styles, $id );
				if ( ! is_object( $style ) ) {
					continue;
				}
				$result->styles[] = (object) array(
					"id"           => $id,
					"title"        => $style->title,
					"colorPalette" => $data->colorPalette,
					"fontStyles"   => $data->fontStyles
				);
			}
		}

		// styles -> missing selected style data
		$selected_style_data_present = false;
		foreach ( $result->styles as $style ) {
			if ( $style->id === $result->selectedStyle ) {
				$selected_style_data_present = true;
			}
		}
		if ( ! $selected_style_data_present ) {
			$selected_style = self::getStyle( $styles, $result->selectedStyle );
			if ( is_object( $selected_style ) ) {
				$result->styles[] = (object) array(
					"id"           => $selected_style->id,
					"title"        => $selected_style->title,
					"colorPalette" => $selected_style->colorPalette,
					"fontStyles"   => $selected_style->fontStyles
				);
			}
		}

		return $result;
	}
}

function unique_id( $n = 32 ) {
	$characters   = 'abcdefghijklmnopqrstuvwxyz';
	$randomString = '';

	for ( $i = 0; $i < $n; $i ++ ) {
		$index        = rand( 0, strlen( $characters ) - 1 );
		$randomString .= $characters[ $index ];
	}

	return $randomString;
}
